import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThan, LessThanOrEqual, IsNull } from 'typeorm';
// 'rrule' ships no package.json "exports" map, so under real Node ESM the named
// import `{ RRule }` cannot be resolved from its CJS build - go through the default export instead.
import RRulePkg from 'rrule';
import { DateTime } from 'luxon';

const { RRule } = RRulePkg;
import { Event } from '../../database/entities/event.entity.js';
import { EventSeries } from '../../database/entities/event_series.entity.js';
import { EventException } from '../../database/entities/event_exception.entity.js';
import { EventService } from './event.service.js';

export interface ExpandedEvent {
  id: string;
  calendarId: string;
  title?: string;
  description?: string;
  externalId?: string;
  timezone?: string;
  startAt: Date;
  endAt?: Date;
  metadata?: Record<string, unknown>;
  isRecurring: boolean;
  recurringInstanceOf?: string;
  isException: boolean;
  exceptionType?: 'cancelled' | 'moved';
}

@Injectable()
export class EventExpanderService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventSeries)
    private readonly eventSeriesRepository: Repository<EventSeries>,
    @InjectRepository(EventException)
    private readonly eventExceptionRepository: Repository<EventException>,
    private readonly eventService: EventService,
  ) {}

  /**
   * Gibt alle Events (inkl. expandierte Serien und Exceptions) für einen Kalender
   * in einem bestimmten Zeitraum zurück
   */
  async getExpandedEventsForCalendar(
    calendarId: string,
    from: Date,
    to: Date,
  ): Promise<ExpandedEvent[]> {
    // 1. Alle direkten Events des Kalenders im Zeitraum
    const directEvents = await this.eventRepository.find({
      where: {
        calendarId,
        startAt: MoreThan(from),
        deletionTime: IsNull(),
      } as FindOptionsWhere<Event>,
    });

    // 2. Alle Event-Serien für Events dieses Kalenders
    const seriesList = await this.eventSeriesRepository.find({
      where: {
        event: { calendarId, deletionTime: IsNull() },
        deletionTime: IsNull(),
      },
      relations: { event: true },
    });

    // 3. Expandiere jede Serie und füge Instanzen hinzu
    const expandedEvents: ExpandedEvent[] = [];

    for (const series of seriesList) {
      const instances = this.expandSeries(series, from, to);
      expandedEvents.push(...instances);
    }

    // 4. Hole alle Exceptions für die Serien dieses Kalenders
    const exceptions = await this.eventExceptionRepository.find({
      where: {
        eventSeries: { event: { calendarId }, deletionTime: IsNull() },
        deletionTime: IsNull(),
      },
      relations: { eventSeries: { event: true }, newEvent: true },
    });

    // 5. Wende Exceptions auf expandierte Events an
    const eventsWithExceptions = this.applyExceptions(expandedEvents, exceptions);

    // 6. Kombiniere direkte Events mit expandierten Events
    //
    // Master-Events, die eine aktive Serie haben, werden ausgeschlossen: series.validFrom
    // entspricht exakt dem startAt des Master-Events (siehe EventSeriesController.resolveValidFrom),
    // wodurch RRule.between(..., true) die dtstart selbst als erste Instanz zurückgibt. Ohne diesen
    // Ausschluss würde der erste Termin doppelt erscheinen - einmal als direktes Event, einmal als
    // erste expandierte Serieninstanz.
    const seriesEventIds = new Set(seriesList.map((series) => series.eventId));
    const result: ExpandedEvent[] = [
      ...directEvents
        .filter((e) => !seriesEventIds.has(e.id))
        .map((e) => this.mapToExpandedEvent(e, false)),
      ...eventsWithExceptions,
    ];

    // 7. Filtere Events, die außerhalb des Zeitraums liegen (für direkte Events)
    const filteredResult = result.filter((e) => {
      // Direkte Events müssen im Zeitraum liegen
      if (!e.isRecurring) {
        return e.startAt.getTime() >= from.getTime() && e.startAt.getTime() <= to.getTime();
      }
      return true;
    });

    // 8. Sortiere nach startAt
    return filteredResult.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  private expandSeries(series: EventSeries, from: Date, to: Date): ExpandedEvent[] {
    // Parse RRULE string und erstelle RRule Objekt
    const rrule = this.createRRuleFromString(series.rrule, series.validFrom, series.timezone);

    // rrule.between() vergleicht gegen die "floating" dtstart aus createRRuleFromString - die
    // Bereichsgrenzen muessen deshalb in dasselbe floating-System konvertiert werden, sonst
    // vergleicht between() Kalendertage in `series.timezone` gegen echte UTC-Instants.
    const floatingFrom = this.toFloatingLocal(from, series.timezone);
    const floatingTo = this.toFloatingLocal(to, series.timezone);

    // Generiere alle Instanzen im Zeitraum
    const floatingInstances = rrule.between(floatingFrom, floatingTo, true);

    return floatingInstances.map((floatingInstance: Date) => {
      const date = this.fromFloatingLocal(floatingInstance, series.timezone);

      // Berechne Dauer aus dem ursprünglichen Event
      const duration = series.event.endAt
        ? series.event.endAt.getTime() - series.event.startAt.getTime()
        : 0;

      const endAt = duration > 0 ? new Date(date.getTime() + duration) : undefined;

      return {
        id: `${series.eventId}-${date.getTime()}`,
        calendarId: series.event.calendarId,
        title: series.event.title,
        description: series.event.description,
        externalId: series.event.externalId,
        timezone: series.timezone || series.event.timezone,
        startAt: date,
        endAt,
        metadata: series.event.metadata,
        isRecurring: true,
        recurringInstanceOf: series.eventId,
        isException: false,
      };
    });
  }

  private applyExceptions(
    events: ExpandedEvent[],
    exceptions: EventException[],
  ): ExpandedEvent[] {
    const result = [...events];

    for (const exception of exceptions) {
      // Finde alle Events, die dieser Exception entsprechen
      const matchingIndex = result.findIndex(
        (e) =>
          e.recurringInstanceOf === exception.eventSeries.eventId &&
          e.startAt.getTime() === exception.originalStart.getTime(),
      );

      if (matchingIndex >= 0) {
        if (exception.isCancelled) {
          // Entferne die Instanz
          result.splice(matchingIndex, 1);
        } else if (exception.isMoved && exception.newEvent) {
          // Ersetze durch das neue Event
          result[matchingIndex] = this.mapToExpandedEvent(
            exception.newEvent,
            true,
            'moved',
          );
        }
      }
    }

    return result;
  }

  private mapToExpandedEvent(
    event: Event,
    isException: boolean = false,
    exceptionType?: 'cancelled' | 'moved',
  ): ExpandedEvent {
    return {
      id: event.id,
      calendarId: event.calendarId,
      title: event.title,
      description: event.description,
      externalId: event.externalId,
      timezone: event.timezone,
      startAt: event.startAt,
      endAt: event.endAt,
      metadata: event.metadata,
      isRecurring: false,
      isException,
      exceptionType,
    };
  }

  private createRRuleFromString(
    rruleString: string,
    dtstart: Date,
    timezone: string,
  ): InstanceType<typeof RRule> {
    // RRULE string über RRule.fromString() parsen (RFC 5545-konform, inkl. INTERVAL,
    // BYMONTH(DAY), UNTIL und BYDAY-Modifikatoren wie "1MO"/"-1SU") und dtstart einsetzen.
    //
    // Vorher wurde das hier von Hand geparst, u.a. mit einer eigenen FREQ-Nummerierung
    // (SECONDLY=0 ... YEARLY=6), die NICHT mit rrule.js' tatsächlichem Frequency-Enum
    // (YEARLY=0 ... SECONDLY=6) übereinstimmte - z.B. wurde FREQ=WEEKLY (4 in der eigenen
    // Nummerierung) von rrule.js als HOURLY (4 im echten Enum) interpretiert. Jede FREQ
    // außer DAILY (zufällig in beiden Nummerierungen 3) war dadurch falsch.
    const floatingDtstart = this.toFloatingLocal(dtstart, timezone);
    try {
      const parsed = RRule.fromString(rruleString);
      return new RRule({ ...parsed.origOptions, dtstart: floatingDtstart });
    } catch (e) {
      // Fallback: taegliche RRULE, falls der String nicht geparst werden kann
      return new RRule({ freq: RRule.DAILY, dtstart: floatingDtstart });
    }
  }

  /**
   * rrule.js wertet FREQ/BYDAY/BYMONTHDAY/... anhand der UTC-Kalenderfelder des übergebenen
   * Date-Objekts aus - nicht anhand der tatsächlichen Zeitzone des Termins. Liegt die lokale
   * Uhrzeit nahe der UTC-Tagesgrenze (z.B. 00:30 Europe/Berlin = 23:30Z am Vortag), ermittelt
   * rrule den falschen Wochentag und die komplette Serie verschiebt sich um einen Tag.
   *
   * Umgehung ("floating time" Trick): ein Date bauen, dessen UTC-Felder den lokalen
   * Kalendertag/die lokale Uhrzeit in `timezone` widerspiegeln - das reicht man rrule statt
   * des echten UTC-Instants. Als Nebeneffekt bleibt die Serie damit auch über DST-Wechsel
   * hinweg auf derselben lokalen Uhrzeit (z.B. "montags 9 Uhr"), statt sich um die
   * Sommer-/Winterzeit-Differenz zu verschieben.
   */
  private toFloatingLocal(date: Date, timezone: string): Date {
    const local = DateTime.fromJSDate(date, { zone: timezone });
    return new Date(
      Date.UTC(
        local.year,
        local.month - 1,
        local.day,
        local.hour,
        local.minute,
        local.second,
        local.millisecond,
      ),
    );
  }

  /**
   * Kehrt toFloatingLocal() um: liest die UTC-Felder eines "floating" Date als Kalendertag/
   * -uhrzeit in `timezone` und liefert den tatsächlichen UTC-Instant dafür zurück.
   */
  private fromFloatingLocal(floating: Date, timezone: string): Date {
    const local = DateTime.fromObject(
      {
        year: floating.getUTCFullYear(),
        month: floating.getUTCMonth() + 1,
        day: floating.getUTCDate(),
        hour: floating.getUTCHours(),
        minute: floating.getUTCMinutes(),
        second: floating.getUTCSeconds(),
        millisecond: floating.getUTCMilliseconds(),
      },
      { zone: timezone },
    );
    return local.toJSDate();
  }
}

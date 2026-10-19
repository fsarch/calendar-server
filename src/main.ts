import { ValidationPipe } from '@nestjs/common';
import { FsArchAppBuilder } from '@fsarch/server';
import { descriptor } from './lib/index.js';

async function bootstrap() {
  const app = await new FsArchAppBuilder(descriptor.module.register(), {
    name: 'Calendar Server',
    version: '1.0.0',
  })
    .addSwagger(descriptor.swagger)
    .enableAuth()
    .enableUac(descriptor.uac.roles)
    .enableSoftDeletion()
    .setDatabase({ entities: descriptor.entities, migrations: descriptor.migrations })
    .build();

  // Global validation pipe (not set up by FsArchAppBuilder itself)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});

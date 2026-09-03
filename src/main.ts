import { ValidationPipe } from '@nestjs/common';
import { FsArchAppBuilder } from '@fsarch/server';
import { AppModule } from './app.module.js';
import { DATABASE_OPTIONS } from './database/index.js';

async function bootstrap() {
  const app = await new FsArchAppBuilder(AppModule, {
    name: 'Calendar Server',
    version: '1.0.0',
  })
    .addSwagger({
      title: 'Calendar Server API',
      description: 'Calendar and Event Management Microservice',
      version: '1.0',
    })
    .enableAuth()
    .enableSoftDeletion()
    .setDatabase(DATABASE_OPTIONS)
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

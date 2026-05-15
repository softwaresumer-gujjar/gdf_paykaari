import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FarmersModule } from './farmers/farmers.module';
import { RetailersModule } from './retailers/retailers.module';
import { MarketRatesModule } from './market-rates/market-rates.module';
import { CollectionModule } from './collection/collection.module';
import { DeliveryModule } from './delivery/delivery.module';
import { BillingModule } from './billing/billing.module';
import { TransportModule } from './transport/transport.module';
import { StaffModule } from './staff/staff.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ReportsModule } from './reports/reports.module';
import { AccountsModule } from './accounts/accounts.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { OrganizationModule } from './organization/organization.module';
import { SchedulerNestModule } from './scheduler/scheduler.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmersModule,
    RetailersModule,
    MarketRatesModule,
    CollectionModule,
    DeliveryModule,
    BillingModule,
    TransportModule,
    StaffModule,
    RealtimeModule,
    ReportsModule,
    AccountsModule,
    SubscriptionModule,
    OrganizationModule,
    SchedulerNestModule,
    PaymentsModule,
    UsersModule,
    NotificationsModule,
  ],
})
export class AppModule {}

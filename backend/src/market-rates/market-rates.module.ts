import { Module } from '@nestjs/common';
import { MarketRatesService } from './market-rates.service';
import { MarketRatesController } from './market-rates.controller';

@Module({
  controllers: [MarketRatesController],
  providers: [MarketRatesService],
  exports: [MarketRatesService],
})
export class MarketRatesModule {}

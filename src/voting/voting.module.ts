import { Module } from '@nestjs/common';
import { VotingUpdate } from './voting.update';

@Module({
  providers: [VotingUpdate],
})
export class VotingModule {}

import { Module } from '@nestjs/common';
import { ScheduleScene } from 'src/voting/scenes/schedule.scene';
import { DescriptionScene } from './scenes/description.scene';
import { TopicsUpdate } from './topics.update';

@Module({
  providers: [TopicsUpdate, DescriptionScene, ScheduleScene],
})
export class TopicsModule {}

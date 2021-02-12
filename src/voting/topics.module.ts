import { Module } from '@nestjs/common';
import { Calendar } from 'src/voting/scenes/calendar';
import { NameScene } from 'src/voting/scenes/name.scene';
import { ScheduleScene } from 'src/voting/scenes/schedule.scene';
import { DescriptionScene } from './scenes/description.scene';
import { TopicsUpdate } from './topics.update';

@Module({
  providers: [
    TopicsUpdate,
    DescriptionScene,
    ScheduleScene,
    Calendar,
    NameScene,
  ],
})
export class TopicsModule {}

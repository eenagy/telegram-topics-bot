import { Module } from '@nestjs/common';
import { DescriptionScene } from './scenes/description.scene';
import { TopicsUpdate } from './topics.update';

@Module({
  providers: [TopicsUpdate, DescriptionScene],
})
export class TopicsModule {}

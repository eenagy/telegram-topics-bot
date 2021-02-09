import { Scene, SceneEnter, SceneLeave, Command, Ctx } from 'nestjs-telegraf';
import { REQUEST_SCENE_ID } from '../../app.constants';
import { Context } from '../../interfaces/context.interface';

@Scene(REQUEST_SCENE_ID)
export class RequestScene {
  @SceneEnter()
  onSceneEnter(): string {
    console.log('Enter to request scene');
    return 'Hello to request interface';
  }

  @SceneLeave()
  onSceneLeave(): string {
    console.log('Leave from scene');
    return 'Bye Bye 👋';
  }

  @Command(['rng', 'random'])
  onRandomCommand(): number {
    console.log('Use "random" command');
    
    return Math.floor(Math.random() * 11);
  }

  @Command('leave')
  async onLeaveCommand(ctx: Context): Promise<void> {
    await ctx.scene.leave();
  }
}

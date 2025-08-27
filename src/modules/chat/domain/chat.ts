import { Entity } from '@shared/base-classes/entity';

type ChatProps = {
  readonly message?: string;
  readonly userId: string;

  readonly createdAt: Date;
};

export class Chat extends Entity<Chat> {
  readonly message?: string;
  readonly userId: string;

  readonly createdAt: Date;

  constructor(properties: ChatProps) {
    super();
    Object.assign(this, properties);
  }
}

export interface IUseCase<Payload, Response> {
  execute(payload: Payload): Response;
}

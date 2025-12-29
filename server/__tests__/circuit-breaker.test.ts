import { CircuitBreaker, CircuitState, CircuitBreakerError } from "../circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker("test-service", {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  it("should start in CLOSED state", () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it("should open circuit after threshold failures", async () => {
    const failingFn = () => Promise.reject(new Error("Service failure"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow();
    }

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it("should reject calls immediately when OPEN", async () => {
    const failingFn = () => Promise.reject(new Error("Service failure"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow();
    }

    await expect(breaker.execute(failingFn)).rejects.toThrow(CircuitBreakerError);
  });

  it("should transition to HALF_OPEN after timeout", async () => {
    const failingFn = () => Promise.reject(new Error("Service failure"));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow();
    }

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const successFn = () => Promise.resolve("success");
    await breaker.execute(successFn);

    expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it("should track successes correctly", async () => {
    const successFn = () => Promise.resolve("success");
    const result = await breaker.execute(successFn);

    expect(result).toBe("success");
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });
});


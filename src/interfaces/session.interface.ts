import { Topic } from "./topic.interface";

export interface Session {
    topics: Topic[]
}
export interface LodashWrapper<T> {
    value(): T
}
export interface SessionStore<T>{
    get<K extends keyof T>(key: K): LodashWrapper<T[K]>;
    set<K extends keyof T>(key: K, value: T[K]): void;
}

export type LocalSession = SessionStore<Session>
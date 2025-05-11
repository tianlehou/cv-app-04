// environment.model.ts
export interface Environment {
  production: boolean;
  environmentType: 'production' | 'demo2' | 'demo4' | 'development';
}
import { describe, expect, it } from 'vitest';
import { avClass, initials } from './avatar';

describe('avatar', () => {
  it('builds initials from usernames', () => {
    expect(initials('maya_chen')).toBe('MC');
    expect(initials('theo')).toBe('TH');
    expect(initials('felix88')).toBe('FE');
    expect(initials('dev_raj')).toBe('DR');
    expect(initials('123')).toBe('12');
  });

  it('picks a stable palette class', () => {
    expect(avClass('maya_chen')).toBe(avClass('maya_chen'));
    expect(avClass('maya_chen')).toMatch(/^av-[1-8]$/);
  });
});

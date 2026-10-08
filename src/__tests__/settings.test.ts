import * as fs from 'fs';
import { createTestEnv, TestEnv } from './helpers/testEnv';

// 设置读写

describe('设置', () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = await createTestEnv('settings');
  });

  afterAll(async () => {
    await env.destroy();
  });

  it('读取初始化时写入的默认设置', () => {
    expect(env.api.getSetting()).toEqual({ sort: true, language: 'china' });
  });

  it('saveSettingByKey 会写入配置文件并能再次读出', () => {
    env.api.saveSettingByKey({ data: { key: 'language', value: 'english' } });

    expect(JSON.parse(fs.readFileSync(env.settingPath, 'utf8'))).toEqual({
      sort: true,
      language: 'english',
    });
    expect(env.api.getSetting()).toEqual({ sort: true, language: 'english' });
  });

  it('配置文件写在测试目录内，不碰用户真实配置', () => {
    expect(env.settingPath.startsWith(env.dir)).toBe(true);
    expect(env.settingPath).not.toContain('/FinancialAssistant/config/');
  });
});

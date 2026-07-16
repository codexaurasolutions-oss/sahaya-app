import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLanguage,
  setLanguage,
} from '../src/Constants/AsyncStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(),
}));

describe('app language storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('migrates a saved Urdu preference to Hindi', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('ur');

    await expect(getLanguage()).resolves.toBe('hi');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('LANGUAGE', 'hi');
  });

  it('never saves Urdu as the app display language', async () => {
    await setLanguage('ur');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('LANGUAGE', 'hi');
  });
});

import { translations } from '../utils/i18n';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTranslation() {
  const language = useSettingsStore(state => state.language);
  return translations[language];
}

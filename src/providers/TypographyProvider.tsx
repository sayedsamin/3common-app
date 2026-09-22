import { createContext, useContext } from 'react';
import type { TextStyle } from 'react-native';

const FontContext = createContext(false);
export const TypographyProvider = FontContext.Provider;

const families = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
const weights = { regular: '400', medium: '500', semibold: '600', bold: '700' } satisfies Record<string, TextStyle['fontWeight']>;

export function useFontStyle(weight: keyof typeof families = 'regular'): TextStyle {
  const isLoaded = useContext(FontContext);
  return isLoaded ? { fontFamily: families[weight], fontWeight: 'normal' } : { fontWeight: weights[weight] };
}

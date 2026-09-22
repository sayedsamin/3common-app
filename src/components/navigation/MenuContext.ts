import { createContext, useContext } from 'react';

type MenuContextValue = {
  isReduced: boolean;
  open: (openDrawer: () => void, restoreFocus?: () => void) => void;
  restoreFocus: () => void;
};
export const MenuContext = createContext<MenuContextValue>({
  isReduced: false,
  open: openDrawer => openDrawer(),
  restoreFocus: () => undefined,
});
export const useMenu = () => useContext(MenuContext);

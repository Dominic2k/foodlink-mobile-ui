/**
 * Navigation types
 */

export type AuthStackParamList = {
  index: undefined;
  login: undefined;
  register: undefined;
};

export type MainTabsParamList = {
  index: undefined;
  explore: undefined;
};

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  modal: undefined;
};

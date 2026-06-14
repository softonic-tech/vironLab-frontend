import { common } from './common';
import { nav } from './nav';
import { footer } from './footer';
import { cart } from './cart';
import { notFound, app } from './pages';
import { landing } from './landing';
import { auth } from './auth';
import { checkout } from './checkout';
import { dashboard } from './dashboard';
import { track } from './track';
import { settings } from './settings';
import { product } from './product';
import { contact } from './contact';
import { faq } from './faq';
import { admin, adminLogin } from './admin';
import { legal } from './legal';

export const sv = {
  common,
  nav,
  footer,
  cart,
  notFound,
  app,
  landing,
  auth,
  checkout,
  dashboard,
  track,
  settings,
  product,
  contact,
  faq,
  admin,
  adminLogin,
  legal,
};

export type SvTranslations = typeof sv;

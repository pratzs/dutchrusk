import * as React from 'react';
import { Analytics, getShopAnalytics, useNonce } from '@shopify/hydrogen';
import { type LoaderFunctionArgs } from '@shopify/remix-oxygen';
import { defer } from '@remix-run/node';

import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  Await,
} from '@remix-run/react';
import favicon from '~/assets/favicon.svg';
import { FOOTER_QUERY, HEADER_QUERY } from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import { PageLayout } from './components/PageLayout';
import { Navigation } from './components/Navigation';

export type RootLoader = typeof loader;

export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

export function links() {
  return [
    { rel: 'preconnect', href: 'https://cdn.shopify.com' },
    { rel: 'preconnect', href: 'https://shop.app' },
    { rel: 'icon', type: 'image/svg+xml', href: favicon },
  ];
}

export async function loader(args: LoaderFunctionArgs) {
  const { storefront, env, customerAccount, cart } = args.context;

  // Create Promises for Suspense
  const cartPromise =
    cart && typeof cart.get === 'function'
      ? cart.get()
      : Promise.resolve(null);

  const isLoggedInPromise =
  customerAccount && typeof customerAccount.isLoggedIn === 'function'
    ? customerAccount.isLoggedIn()
    : Promise.resolve(false); // <-- Fix: always boolean


  const header = await storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: { headerMenuHandle: 'main-menu' },
  });

  const footerPromise =
    storefront && typeof storefront.query === 'function'
      ? storefront
          .query(FOOTER_QUERY, {
            cache: storefront.CacheLong(),
            variables: { footerMenuHandle: 'footer' },
          })
          .catch(() => null)
      : Promise.resolve(null);

  const COLLECTIONS_QUERY = `#graphql
    query {
      collections(first: 20, sortKey: TITLE) {
        nodes {
          handle
          title
        }
      }
    }
  `;
  const { collections } = await storefront.query(COLLECTIONS_QUERY);

  let shopAnalytics = null;
  if (env.PUBLIC_STOREFRONT_ID && storefront) {
    shopAnalytics = await getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    });
  }

  // Use `defer` for Suspense support in the UI
  return defer({
    cart: cartPromise,
    isLoggedIn: isLoggedInPromise,
    header,
    footer: footerPromise,
    collections: collections.nodes,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: shopAnalytics,
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });
}

export function Layout({ children }: { children?: React.ReactNode }) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');

  if (!data || !data.consent) return null;

  return (
    <>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss} />
        <link rel="stylesheet" href={resetStyles} />
        <link rel="stylesheet" href={appStyles} />
        <Meta />
        <Links />
      </head>
      <body>
        <Analytics.Provider
          cart={null} // You can resolve and pass cart if you want analytics
          shop={data.shop}
          consent={data.consent}
        >
          <Navigation />
          <PageLayout
            cart={data.cart}
            isLoggedIn={data.isLoggedIn}
            header={data.header}
            footer={data.footer}
            collections={data.collections}
            publicStoreDomain={data.publicStoreDomain}
          >
            {children}
          </PageLayout>
        </Analytics.Provider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}

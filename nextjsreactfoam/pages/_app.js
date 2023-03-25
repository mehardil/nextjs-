import React, { useState, useEffect, useCallback } from "react";
import {
  Provider as SessionProvider,
  useSession,
  signIn,
} from "next-auth/client";
import Router, { useRouter } from "next/router";
import Head from "next/head";
import { NextIntlProvider, IntlErrorCode } from "next-intl";
import { ToastProvider } from "react-toast-notifications";
import * as Sentry from "@sentry/nextjs";
import { ErrorBoundary } from "react-error-boundary";
import jwt from "jsonwebtoken";
import Cookies from "universal-cookie";
import "simple-line-icons/dist/styles/simple-line-icons.css";
import "animate.css/animate.css";
import "pace-js/themes/green/pace-theme-flash.css";
import "flag-icon-css/css/flag-icon.min.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-tippy/dist/tippy.css";
import "react-quill/dist/quill.snow.css";
import "draft-js/dist/Draft.css";
import "@/assets/plugins/bootstrap/css/bootstrap.css";
import "@/assets/plugins/dataTables.bootstrap.css";
import "@/assets/plugins/font-awesome/css/all.css";
import "@/assets/plugins/gritter/css/jquery.gritter.css";
import "@/assets/plugins/password-indicator/css/password-indicator.css";
import "@/assets/plugins/jquery-smart-wizard/dist/css/smart_wizard.min.css";
import "@/assets/plugins/rt-editor/rt-editor.css";
import "@/assets/style.css";
import "@/assets/style-responsive.css";
import "@/assets/theme/default.css";
import "@/assets/custom.css";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import ErrorPage from "@/components/common/ErrorPage";
import LoginPage from "@/components/common/LoginPage";
import PageLoader from "@/components/common/PageLoader";
import UnauthorizedPage from "@/components/common/UnauthorizedPage";
import SiteWideErrorBoundary from "@/components/error-boundaries/SiteWideErrorBoundary";
import BaseLayout from "@/components/layouts/BaseLayout";
import { LayoutProvider } from "@/contexts/LayoutContext";
import Notification from "@/components/ui/Notification";
// import Chat from "@/components/common/Chat";

import "./styles.css";
import "../components/common/Chat/styles.css";

/**
 * Callback when an error occured upon translating locales.
 * Reports and logs the issue to Sentry.
 *
 * @param {Object} error
 */
const onI18nError = (error) => {};

/**
 * Sets a fallback message when a locale is missing or
 * an error occured.
 *
 * @param {Object} param
 * @param {Object} param.error
 * @returns
 */
const getI18nMessageFallback = ({ error }) => {
  return "[**Not translated yet**]";
};

/**
 * Renders the component with authentication.
 *
 * @param {ReactElement} params.Component
 * @param {Object} params.pageProps
 * @returns
 */
const PageComponent = ({ Component, pageProps }) => {
  const [session, loading] = useSession();
  const [isPageLoading, setPageLoading] = useState(false);
  const PageLayout = Component.Layout || BaseLayout;

  /**
   * Compose the component together with its
   * defined layout component, if any.
   *
   * @returns {ReactElement}
   */
  const RenderComponent = () => (
    <PageLayout>
      <Head>
        <title>Currinda</title>
      </Head>
      <Component {...pageProps} />
      {/* <Chat /> */}
    </PageLayout>
  );

  /**
   * Display loading or spinner while fetching
   * session or data.
   */
  if (loading || isPageLoading) return <PageLoader />;

  Router.events.on("routeChangeStart", () => setPageLoading(true));
  Router.events.on("routeChangeComplete", () => setPageLoading(false));
  Router.events.on("routeChangeError", () => setPageLoading(false));

  /**
   * Check if the component is authorized, only
   * logged in users are allowed to access. Authorized
   * components allows loggedin users with no roles initially.
   */
  if (Component.authorized) {
    /**
     * If session exists, proceed to the next layer
     * of authorization.
     */
    if (session) {
      /**
       * If "allowedRoles" is defined in a component, check if
       * the session's user's role is included among the defined roles.
       * Or else...
       */
      if (Component.allowedRoles && !Component.allowedRoles.includes("Admin")) {
        /**
         * YOU SHALL NOT PASS!!!
         */
        return <UnauthorizedPage />;
      }

      /**
       * If all good, renders the component like nothing happened :).
       */
      return <RenderComponent />;
    }

    /**
     * If session doesnt exists...
     * redirect to login page with callbackUrl
     */
    return <div>{signIn(null, { error: "" })}</div>;
  }

  /**
   * Renders the component, just like the good old times.
   */
  return <RenderComponent />;
};

const App = (props) => {
  const { locale } = useRouter();
  const messages = require(`../locales/${locale}.json`);

  return (
    <SessionProvider
      pageProps={props.pageProps.session}
      options={{
        clientMaxAge: 1 * 60 * 60,
        keepAlive: 1 * 60 * 60,
      }}
    >
      <NextIntlProvider
        messages={messages}
        onError={onI18nError}
        getMessageFallback={getI18nMessageFallback}
      >
        <ErrorBoundary FallbackComponent={SiteWideErrorBoundary}>
          <LayoutProvider>
            <ToastProvider
              autoDismissTimeout={5000}
              components={{
                ToastContainer: Notification.Wrapper,
                Toast: Notification,
              }}
            >
              <PageComponent {...props} />
            </ToastProvider>
          </LayoutProvider>
        </ErrorBoundary>
      </NextIntlProvider>
    </SessionProvider>
  );
};

export default App;

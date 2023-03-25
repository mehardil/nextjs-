import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, getCsrfToken, getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import camelCase from "lodash/camelCase";
import Logo from "@/components/common/Logo";
import PageAuthLayout from "@/components/layouts/PageAuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Note from "@/components/ui/Note";
import roles from "@/constants/roles";
import { useLayoutDispatch } from "@/contexts/LayoutContext";
import { SET_PAGE_AUTH_LAYOUT_PROPS } from "@/contexts/action-types";
import paths from "@/routes/paths";
import interpolatePath from "@/utils/interpolatePath";

const Login = ({ csrfToken, callbackUrl }) => {
  const { error } = useRouter().query;
  const t = useTranslations();
  const { control, handleSubmit } = useForm();
  const layoutDispatch = useLayoutDispatch();
  const [isLogginIn, setLoggingIn] = useState(false);

  const handleLogin = async ({ email, password }) => {
    setLoggingIn(true);
    const options = { email, password };

    if (callbackUrl) {
      options.callbackUrl = callbackUrl;
    }

    await signIn("credentials", options);

    setLoggingIn(false);
  };

  /**
   * Sets the page auth layout states to
   * provide some additional classnames to the layout.
   */
  useEffect(() => {
    /**
     * Sets the title and caption of the layout's feed.
     * Used dispatch because localisation is only available
     * inside functional components.
     */
    layoutDispatch({
      type: SET_PAGE_AUTH_LAYOUT_PROPS,
      payload: {
        title: t("common.currinda"),
        caption: t("common.currindaDesc"),
        feed: true,
      },
    });
  }, []);

  return (
    <>
      <PageAuthLayout.Header>
        <Logo />
      </PageAuthLayout.Header>
      <PageAuthLayout.Content>
        {error && (
          <Note color="danger">
            <span>{t(`errors.page.login.${camelCase(error)}`)}</span>
          </Note>
        )}

        <form onSubmit={handleSubmit(handleLogin)} autoComplete="off">
          <Controller
            name="email"
            control={control}
            render={({ name, onChange }) => (
              <Input
                size="lg"
                type="email"
                name={name}
                onChange={onChange}
                placeholder={t("common.forms.fields.emailAddress")}
                className="mb-2"
                disabled={isLogginIn}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ name, onChange }) => (
              <Input
                size="lg"
                type="password"
                name={name}
                onChange={onChange}
                placeholder={t("common.forms.fields.password")}
                disabled={isLogginIn}
              />
            )}
          />
          <Input
            size="lg"
            name="csrfToken"
            type="hidden"
            defaultValue={csrfToken}
          />
          <Input.Checkbox
            label={t("common.forms.fields.rememberMe")}
            className="m-b-30"
            disabled={isLogginIn}
          />
          <div className="login-buttons">
            <Button
              type="submit"
              color="success"
              size="lg"
              isLoading={isLogginIn}
              isFullWidth
            >
              {t("common.forms.signMeIn")}
            </Button>
          </div>
        </form>
        <div className="m-t-20 m-b-20 text-inverse">
          <Link href={paths.USER_ADD}>
            <a className="text-success">{t("page.login.forgotYourPassword")}</a>
          </Link>
        </div>
      </PageAuthLayout.Content>
    </>
  );
};

export async function getServerSideProps(context) {
  const { req, res } = context;
  const session = await getSession({ req });
  let dashboard = paths.USER_DASHBOARD;

  if (session) {
    const userRoles = session.user.roles;

    if (context.query.callbackUrl) {
      dashboard = context.query.callbackUrl;
    }

    if (userRoles.find(({ role }) => role === roles.ADMIN)) {
      dashboard = paths.ADMIN_EVTS_YOUR;
    } else if (
      userRoles.some(({ role }) => {
        return [
          roles.REVIEWER,
          roles.CONVENOR,
          roles.FINANCIALCOMMITEE,
        ].includes(role);
      })
    ) {
      dashboard = paths.USER_DASHBOARD;
    }

    /**
     * Redirects users to specific dashboard if no
     * callbackUrl is defined by next-auth.
     */
    res.writeHead(302, {
      Location: dashboard,
    });
    res.end();

    return {
      props: {},
    };
  }

  return {
    props: {
      csrfToken: await getCsrfToken(context),
      callbackUrl: context?.query?.callbackUrl || "",
    },
  };
}

Login.Layout = PageAuthLayout;

export default Login;

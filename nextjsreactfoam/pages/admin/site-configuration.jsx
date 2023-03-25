import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import { isPlainObject, omit } from "lodash";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import SiteConfigurationForm from "@/components/forms/SiteConfigurationsForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import SweetAlert from "@/components/ui/SweetAlert";
import countriesstates from "@/constants/countries-states";
import timezones from "@/constants/timezones";
import { ADMIN } from "@/constants/roles";
import {
  countryOptions,
  primaryPurposeOptions,
  timezoneOptions,
} from "@/options";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import requestParamBuilder from "@/utils/requestParamBuilder";
import setDefaultValues, { URLSTRING, OPTION } from "@/utils/setDefaultValues";

const SiteConfiguration = ({ site, context, session }) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isSaving, setSaving] = useState(false);

  const methods = useForm({
    defaultValues: setDefaultValues(site, {
      privacy_policy_uri: { type: URLSTRING },
      refund_policy_uri: { type: URLSTRING },
      terms_and_conditions_uri: { type: URLSTRING },
      website: { type: URLSTRING },
      company_country: { type: OPTION, options: countryOptions },
      default_timezone: { type: OPTION, options: timezoneOptions },
      primary_purpose: { type: OPTION, options: primaryPurposeOptions },
    }),
  });

  const handleSiteUpdate = async (params) => {
    setSaving(true);

    let requestParams = requestParamBuilder(params, {
      formData: true,
      sanitize: true,
      isPut: true,
    });

    try {
      const response = await api({
        url: "tenant",
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        addToast(t("common.notifs.successfullySaved", {
          entityName: "",
          entity: t("common.siteConfiguration", { entries: 1 }),
        }),);
        router.replace(router.asPath);
      });

      router.push(router);
    } catch (e) {
      addToast("Failed to save configuration.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleSiteUpdate)}
      isLoading={isSaving}
    >
      <Icon icon="plus" className="mr-1" />
      {t("common.forms.saveChanges")}
    </Button>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Site Configuration" toolbar={pageHeaderToolbar} />
      <Panel title="Site Configuration" color="inverse" maximizable collapsable>
        <FormProvider {...methods}>
          <form>
            <SiteConfigurationForm {...{ isSaving }} />
          </form>
        </FormProvider>
      </Panel>
    </ContentErrorBoundary>
  );
};
export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    const response = await api({
      url: "tenant",
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        site: response.data.data,
      },
    };
  }

  return {
    props: {
      notFound: true,
    },
  };
};
SiteConfiguration.authorized = true;
SiteConfiguration.allowedRoles = [ADMIN];
SiteConfiguration.Layout = DashboardLayout;
SiteConfiguration.defaultProps = {
  SiteConfigurations: [],
};

export default SiteConfiguration;

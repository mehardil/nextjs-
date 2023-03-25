import Button from "@/components/ui/Button";

import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import { isPlainObject, omit } from "lodash";
import queryString from "query-string";
import formatISO from "date-fns/formatISO";
import PageHeader from "@/components/common/PageHeader";
import OrganisationFinancialForm from "@/components/forms/OrganisationSetupFinancialForm";

import Wizard from "@/components/ui/Wizard2";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import useWizardSteps, { ORGA_STEP } from "@/hooks/useWizardSteps";
import { ADMIN } from "@/constants/roles";
import actionTypes from "@/contexts/action-types";
import { useGlobalState, useGlobalDispatch } from "@/contexts/GlobalContext";
import { useLayoutDispatch } from "@/contexts/LayoutContext";
import useLocalTimezone from "@/hooks/useLocalTimezone";
import { eventTypeOptions, timezoneOptions } from "@/options";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { redirectToAllEvent } from "@/utils/redirects";
import { withAuthUser, withOrganization, withTenant } from "@/utils/pipes";
import taxJurisdictions from "@/constants/taxJurisdictions";

import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import { useRouter } from "next/router";
import currencies, { AUD } from "@/constants/currencies";
import taxTypes from "@/constants/taxTypes";

import setDefaultValues, {
  URLSTRING,
  ASYNC_OPTION,
  OPTION,
  DATEPICKER,
  DATE_RANGE,
} from "@/utils/setDefaultValues";
import DateTime from "@/components/ui/Input/components/DateTime";
import { updateOrgaFinancial } from "@/requests/organization";

const AddOrgFinanciaIndexPage = ({
  authUser,
  Organization,
  tenant,
  session,
}) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isLoading, setIsLoading] = useState(false);

  const globalDispatch = useGlobalDispatch();
  const [paymentGateways, setPaymentGateways] = useState([]);

  const localTimezone = useLocalTimezone();
  const { getSteps } = useWizardSteps(ORGA_STEP);
  const [bankAccounts, setBankAccounts] = useState([]);

  const OrganizationSteps = getSteps(Organization);

  const currencyOptions = currencies.map((currencyItem) => ({
    label: currencyItem,
    value: currencyItem,
  }));

  const taxTypeOptions = taxTypes.map((type) => ({
    label: t(`common.forms.fields.${type}`),
    value: type,
  }));

  const taxJurisdictionOptions = Object.keys(taxJurisdictions).map((tax) => ({
    label: taxJurisdictions[tax],
    value: tax,
  }));

  const bankAccountOptions = bankAccounts.map((bankAccount) => ({
    label: bankAccount?.name,
    value: bankAccount?.id,
  }));

  const paymentGatewayOptions = paymentGateways.map((paymentGateway) => ({
    label: paymentGateway?.name,
    value: paymentGateway?.id,
  }));

  const methods = useForm({
    defaultValues: setDefaultValues(Organization || {}, {
      currency: { type: OPTION, options: currencyOptions },
      tax_type: { type: OPTION, options: taxTypeOptions },
      payment_gateway: { type: ASYNC_OPTION },
      accounts_email: {
        type: ASYNC_OPTION,
        value: Organization?.accounts_email,
      },
    }),
  });
  const handleSubmit = async (params, { redirectToNextStep }) => {
    setIsLoading(true);


    try {
      await updateOrgaFinancial(Organization?.id, params, session.accessToken);

      redirectToNextStep({
        query: { organizationId: Organization?.id },
      });
    } catch (e) {
      addToast("Failed to create", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader title={"Add Organization"} />
      <FormProvider {...methods}>
        <Wizard
          steps={OrganizationSteps}
          onNext={({ redirectToNextStep }) =>
            methods.handleSubmit((params) =>
              handleSubmit(params, { redirectToNextStep })
            )()
          }
        >

          <OrganisationFinancialForm isSaving={isLoading} />
        </Wizard>

      </FormProvider>
    </>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withOrganization, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);


      if (session) {
        return {
          props: {
            session,
            ...pipeProps,
          },
        };
      }
    return {
        notFound: true,
      };
    }
  );

AddOrgFinanciaIndexPage.authorized = true;
AddOrgFinanciaIndexPage.Layout = DashboardLayout;

export default AddOrgFinanciaIndexPage;

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

import OrganisationSetupCustomQuestion from "@/components/forPage/OrganisationSetupWizard/OrganisationSetupCustomQuestion";
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
import { updateOrgaCustomQuestion } from "@/requests/organization";

const AddOrgCustomQuestionIndexPage = ({
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
  const methods = useForm({
    defaultValues: setDefaultValues(Organization || {}),
  });
  const handleSubmit = async (params, { redirectToNextStep }) => {
    setIsLoading(true);

    try {
      await updateOrgaCustomQuestion(
        Organization?.id,
        params,
        session.accessToken
      );

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
          <OrganisationSetupCustomQuestion isSaving={isLoading} />
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

AddOrgCustomQuestionIndexPage.authorized = true;
AddOrgCustomQuestionIndexPage.Layout = DashboardLayout;

export default AddOrgCustomQuestionIndexPage;

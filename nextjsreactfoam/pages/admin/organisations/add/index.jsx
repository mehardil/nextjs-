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
import OrganisationGeneralForm from "@/components/forms/OrganisationSetupGeneralForm";

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
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import { useRouter } from "next/router";

import setDefaultValues, {
  URLSTRING,
  OPTION,
  DATEPICKER,
  DATE_RANGE,
} from "@/utils/setDefaultValues";
import DateTime from "@/components/ui/Input/components/DateTime";

const AddOrgIndexPage = ({ authUser, Organization, tenant, session }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const globalDispatch = useGlobalDispatch();
  const localTimezone = useLocalTimezone();
  const { getSteps } = useWizardSteps(ORGA_STEP);

  const OrganizationSteps = getSteps(Organization);


  const [isLoading, setLoading] = useState(false);
  const methods = useForm({
    defaultValues: setDefaultValues({ ...Organization } || {}),
  });

  const handleSubmit = async (params, { redirectToNextStep }) => {
    setLoading(true);
    try {
      const method = Organization?.id ? "PUT" : "POST";
      const path = Organization?.id ? apiPaths.ORG : apiPaths.ORGS;
      const url = interpolatePath(path, { organizationId: Organization?.id });

      const requestBody = requestParamBuilder({
        ...params,
      });

      const organizationResponse = await api({
        url,
        method,
        data: requestBody,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      redirectToNextStep({
        query: {
          organizationId: Organization?.id
            ? Organization?.id
            : organizationResponse.data.data.id,
        },
      });
    } catch (e) {
      addToast("Failed to create an organisation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setLoading(false);
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
          <OrganisationGeneralForm />
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

AddOrgIndexPage.authorized = true;
AddOrgIndexPage.Layout = DashboardLayout;

export default AddOrgIndexPage;

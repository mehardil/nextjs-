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
import EventGeneralForm, {
  GENERAL_DETAILS,
  SCHEDULE_INFORMATION,
  PROJECT_AVAILABILITY,
  MISC_SETTINGS,
  TEAM_MEMBERS,
} from "@/components/forms/EventGeneralForm";
import Wizard from "@/components/ui/Wizard2";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import useWizardSteps, { EVENT_STEP } from "@/hooks/useWizardSteps";
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
import { withAuthUser, withEvent, withTenant } from "@/utils/pipes";
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
const AddEventIndexPage = ({ authUser, event, tenant, session }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const globalDispatch = useGlobalDispatch();
  const localTimezone = useLocalTimezone();
  const { getSteps } = useWizardSteps(EVENT_STEP);
  const eventSteps = getSteps(event);
  const [isLoading, setLoading] = useState(false);

  const methods = useForm({
    defaultValues: setDefaultValues(
      { ...event, event_dates: undefined, registration_dates: undefined } || {},
      {
        type: { type: OPTION, options: eventTypeOptions },
        timezone: { type: OPTION, options: timezoneOptions },
        registration_timezone: { type: OPTION, options: timezoneOptions },
        website: { type: URLSTRING },
        event_dates: {
          type: DATE_RANGE,
          from: event?.start_date || undefined,
          to: event?.end_date || undefined,
        },
        registration_dates: {
          type: DATE_RANGE,
          from: event?.registration_open || undefined,
          to: event?.registration_end || undefined,
        },
      }
    ),
  });
  const handleSubmit = async (params, { redirectToNextStep }) => {
    setLoading(true);
    try {
      const method = event?.id ? "PUT" : "POST";
      const path = event?.id ? apiPaths.EVT : apiPaths.EVTS;
      const url = interpolatePath(path, { eventId: event?.id });
      const requestBody = requestParamBuilder({
        ...params,
        start_date: params.event_dates?.from,
        end_date: params.event_dates?.to,
        registration_open: params.registration_dates?.from,
        registration_end: params.registration_dates?.to,
      });
      const eventResponse = await api({
        url,
        method,
        data: requestBody,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });
      redirectToNextStep({
        query: { eventId: event?.id ? event?.id : eventResponse.data.data.id },
      });
    } catch (e) {
      addToast("Failed to create event", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <PageHeader title={"Add Event"} />
      <FormProvider {...methods} >
        <Wizard
          steps={eventSteps}
          onNext={({ redirectToNextStep }) =>
            methods.handleSubmit((params) =>
              handleSubmit(params, { redirectToNextStep })
            )()
          }
        >
          <EventGeneralForm  isSaving={isLoading} />
        </Wizard>
      </FormProvider>
    </>
);
};
export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withEvent, withTenant])(
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
AddEventIndexPage.authorized = true;
AddEventIndexPage.Layout = DashboardLayout;
export default AddEventIndexPage;

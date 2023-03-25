import React from "react";
import { getSession } from "next-auth/client";
import Wizard from "@/components/ui/Wizard2";
import { useSession } from "next-auth/client";

import {
  useForm,
  useFormContext,
  Controller,
  FormProvider,
} from "react-hook-form";
import formatISO from "date-fns/formatISO";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import PageHeader from "@/components/common/PageHeader";
import EventSetupWizard from "@/components/forPage/EventSetupWizard";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import useWizardSteps, { EVENT_STEP } from "@/hooks/useWizardSteps";
import { updateEventSocial } from "@/requests/event";

import { useToasts } from "react-toast-notifications";

import EventSocialMediaForm from "@/components/forms/EventSocialMediaForm";

import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import omit from "lodash/omit";
import isPlainObject from "lodash/isPlainObject";

import {
  withAuthUser,
  withEvent,
  withEventAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";

const AddEventSocial = ({ event, session }) => {
  const methods = useForm({
    defaultValues: {
      ...event,
    },
  });

  const { getSteps } = useWizardSteps(EVENT_STEP);

  const eventSteps = getSteps(event);

  const handleSubmit = async (
    params,
    { redirectToNextStep, redirectToAllevent }
  ) => {
    try {
      const socialResponse = await updateEventSocial(
        event?.id,
        params,
        session.accessToken
      );

      const response = await api({
        url: `events/${event?.id}`,
        method: "POST",
        data: requestParams,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });
      if (redirectToAllevent) {
        redirectToAllevent();
      }
      redirectToNextStep();
    } catch (e) {
      return false;
    } finally {
    }
  };

  return (
    <FormProvider {...methods}>
      <Wizard
        steps={eventSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
        onSaveAndExit={({ redirectToAllevent }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToAllevent })
          )()
        }
      >
        <EventSocialMediaForm />
      </Wizard>
    </FormProvider>
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

AddEventSocial.authorized = true;
AddEventSocial.Layout = DashboardLayout;

export default AddEventSocial;

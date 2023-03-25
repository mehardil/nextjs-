 React from "react";
import { getSession } from "next-auth/client";
import Wizard from "@/components/ui/Wizard2";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";

import paths from "@/routes/paths";

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
import { useToasts } from "react-toast-notifications";


import EventGraphicForm from "@/components/forms/EventGraphicForm";

import { ADMIN } from "@/constants/roles";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import omit from "lodash/omit";
import isPlainObject from "lodash/isPlainObject";
import { updateEventGraphics } from "@/requests/event";
import { StoreItemsId, StoreItemsCheck } from "@/utils/localStorageFunctions";

import {
  withAuthUser,
  withEvent,
  withEventAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";

const AddEventGraphics = ({ event, session }) => {
  const { addToast } = useToasts();
  const t = useTranslations();
  const methods = useForm({
    defaultValues: {
      ...event,
    },
  });

  const { getSteps } = useWizardSteps(EVENT_STEP);
  const router = useRouter();
  const { addToast } = useToasts();

  const eventSteps = getSteps(event);

  const handleSubmit = async (params, { redirectToNextStep }) => {
    try {
      const graphicsResponse = await updateEventGraphics(
        event?.id,
        params,
        session.accessToken
      );

      if (!StoreItemsCheck("event", event?.id)) {
        StoreItemsId("event", event?.id);
      }

      const response = await api({
        url: `events/${event?.id}`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });
      addToast("Event  successfully Added.", {
        appearance: "success",
        autoDismiss: true,
      });
      router.pathname = paths.ADMIN_EVT_DASHBOARD;


      router.query.eventId = response.data.data.id;

      router.push(router);
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
      >
        <EventGraphicForm />
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

AddEventGraphics.authorized = true;
AddEventGraphics.Layout = DashboardLayout;

export default AddEventGraphics;

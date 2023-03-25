import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import PageHeader from "@/components/common/PageHeader";
import ProfileForm from "@/components/forms/ProfileForm";
import Wizard from "@/components/ui/Wizard2";
import { useGlobalState, useGlobalDispatch } from "@/contexts/GlobalContext";
import { useLayoutDispatch } from "@/contexts/LayoutContext";
import actionTypes from "@/contexts/action-types";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import { updateUser } from "@/requests/user";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import {
  withAuthUser,
  withEvent,
  withEventAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";

const RegisterIndexPage = ({
  authUser,
  event,
  eventAddonPages,
  tenant,
  session,
}) => {
  const { addToast } = useToasts();
  const globalDispatch = useGlobalDispatch();
  const layoutDispatch = useLayoutDispatch();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const methods = useForm({
    defaultValues: {
      ...authUser,
      extra_emails: authUser?.extra_emails?.map(({ email }) => ({
        label: email,
        value: email,
      })),
    },
  });

  const eventRegistrationSteps = getSteps(event, authUser, eventAddonPages);

  const handleSubmit = async (params, { redirectToNextStep }) => {
    try {
      await updateUser(authUser.id, params, session.accessToken);
      addToast("User updated successfully", {
        appearance: "success",
        autoDismiss: true,
      });
      redirectToNextStep();
    } catch (e) {
      addToast("Failed to update user.", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  useEffect(() => {
    layoutDispatch({
      type: actionTypes.TOGGLE_SIDEBAR_MINIFY,
      payload: true,
    });

    return () => {
      layoutDispatch({
        type: actionTypes.TOGGLE_SIDEBAR_MINIFY,
        payload: false,
      });
    };
  }, [layoutDispatch]);

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_TENANT,
      payload: tenant,
    });
  }, [tenant, globalDispatch]);

  return (
    <FormProvider {...methods}>
      <Wizard
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        <ProfileForm />
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEvent, withTenant])(
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

RegisterIndexPage.authorized = true;
RegisterIndexPage.Layout = RegistrationLayout;

export default RegisterIndexPage;

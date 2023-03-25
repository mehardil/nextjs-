import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import { isEmpty } from "lodash";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import serverSidePipe from "@/utils/serverSidePipe";
import DefaultEventExtrasForm from "@/components/forms/DefaultEventExtrasForm";
import ExtrasForm from "@/components/common/ExtrasForm";
import Wizard from "@/components/ui/Wizard2";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import { useLayoutDispatch } from "@/contexts/LayoutContext";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import actionTypes from "@/contexts/action-types";
import { createEventExtraAnswer } from "@/requests/eventExtraAnswers";
import paths from "@/routes/paths";
import interpolatePath from "@/utils/interpolatePath";
import {
  withAuthUser,
  withEvent,
  withEventAndAddonPages,
  withEventExtra,
  withTenant,
  withUserRegistration,
} from "@/utils/pipes";

const ExtraInformationPage = ({
  userRegistration,
  authUser,
  event,
  eventCustomQuestions,
  tenant,
  session,
}) => {
  const globalDispatch = useGlobalDispatch();
  const layoutDispatch = useLayoutDispatch();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);
  const { addToast } = useToasts();
  const methods = useForm({
    defaultValues: {
      details_published: userRegistration?.details_published,
      dietary_requirements: authUser.dietary_requirements,
      special_requirements: authUser.special_requirements,
    },
  });

  useEventRegistrationDispatches({ authUser, event, tenant });

  const handleSubmit = async (params, { redirectToNextStep }) => {
    if (!isEmpty(params)) {
      try {
        await createEventExtraAnswer(event?.id, params, session.accessToken);
        addToast("Extra information saved successfully.", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (e) {

        addToast("Failed to save extra information.", {
          appearance: "error",
          autoDismiss: true,
        });

        return;
      }
    }

    redirectToNextStep();
  };

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
        <div className="form-row">
          <div className="col-md-6">
            <ExtrasForm extras={eventCustomQuestions} />
            <DefaultEventExtrasForm />
          </div>
        </div>
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [
    withAuthUser,
    withEventAndAddonPages,
    withEventExtra,
    withTenant,
    withUserRegistration,
  ])(async (context, pipeProps) => {
    const session = await getSession(context);

    if (session) {
      if (!pipeProps.userRegistration) {
        context.res.writeHead(302, {
          Location: interpolatePath(paths.DELEGATE_REGISTER, {
            eventId: pipeProps.event.id,
          }),
        });
        context.res.end();
      }

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
  });

ExtraInformationPage.authorized = true;
ExtraInformationPage.Layout = RegistrationLayout;

export default ExtraInformationPage;

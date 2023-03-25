import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import EventFinancialForm from "@/components/forms/EventFinancialForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Wizard from "@/components/ui/Wizard2";
import useWizardSteps, { EVENT_STEP } from "@/hooks/useWizardSteps";
import { currencyOptions, taxTypeOptions } from "@/options";
import { updateEventFinancial } from "@/requests/event";
import { withEvent, withTenant } from "@/utils/pipes";
import setDefaultValues, {
  ASYNC_OPTION,
  OPTION,
} from "@/utils/setDefaultValues";
import serverSidePipe from "@/utils/serverSidePipe";

const AddEventFinancialPage = ({ event, session }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { getSteps } = useWizardSteps(EVENT_STEP);
  const { addToast } = useToasts();
  const eventSteps = getSteps(event);

  const methods = useForm({
    defaultValues: setDefaultValues(event || {}, {
      currency: { type: OPTION, options: currencyOptions },
      currency: { type: OPTION, options: currencyOptions },
      tax_type: { type: OPTION, options: taxTypeOptions },
      payment_gateway: { type: ASYNC_OPTION },
      accounts_email: { type: ASYNC_OPTION, value: event?.accounts_email },
    }),
  });

  const handleSubmit = async (params, { redirectToNextStep }) => {

    setIsLoading(true);

    try {
      await updateEventFinancial(event?.id, params, session.accessToken);

      redirectToNextStep({
        query: { eventId: event?.id },
      });
      if (redirectToAllevent) {
        redirectToAllevent();
      }
      redirectToNextStep();
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
        <EventFinancialForm isSaving={isLoading} />
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

AddEventFinancialPage.authorized = true;
AddEventFinancialPage.Layout = DashboardLayout;

export default AddEventFinancialPage;

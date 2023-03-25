import React, { useState } from "react";
import { getSession } from "next-auth/client";
import Image from "next/image";
import Link from "next/link";
import {
  useForm,
  useFormContext,
  Controller,
  FormProvider,
} from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import EventUserRegistrationLedgersTable from "@/components/common/EventUserRegistrationLedgersTable";
import PaymentForm from "@/components/forms/PaymentForm";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Wizard from "@/components/ui/Wizard2";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import { purchase } from "@/requests/payment";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import {
  withAuthUser,
  withEventAndAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";
import interpolatePath from "@/utils/interpolatePath";

const RegisterPaymentPage = ({
  ledgers,
  authUser,
  event,
  tenant,
  headers,
  session,
}) => {
  const methods = useForm({
    defaultValues: { nametag: authUser.nametag || authUser.full_name },
  });
  const { addToast } = useToasts();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);
  const watchNametag = methods.watch("nametag");

  const handleSubmit = async (params, { redirectToNextStep }) => {

  };

  useEventRegistrationDispatches({ authUser, event, tenant });

  return (
    <FormProvider {...methods}>
      <Wizard
        skippable
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        <PaymentForm
          registrable={event}
          registrableType="event"
          currency={event?.currency}
          paymentGateway={event?.payment_gateway}
          ledgers={ledgers}
          allowsCreditCardPayment
        />
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEventAndAddonPages, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const registrationResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_REGISTRATIONS, {
            eventId: pipeProps.event.id,
            query: {
              event: pipeProps.event.id,
              user: pipeProps.authUser.id,
            },
          }),
        });

        const ledgersResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_REGISTRATION_LEDGERS, {
            eventId: pipeProps.event.id,
            registrationId: registrationResponse?.data?.data?.[0]?.id,
            query: {
              notPaid: 1,
              payable: 1,
            },
          }),
        });

        return {
          props: {
            headers,
            session,
            ...pipeProps,
            ledgers: ledgersResponse.data.data,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

RegisterPaymentPage.authorized = true;
RegisterPaymentPage.Layout = RegistrationLayout;

export default RegisterPaymentPage;

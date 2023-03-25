import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import PageHeader from "@/components/common/PageHeader";

import PaymentsTable from "@/components/common/PaymentsTable";
import OutstandingInvoiceItemsTable from "@/components/common/OutstandingInvoiceItemsTable";
import PaymentForm from "@/components/forms/PaymentForm";
import Panel from "@/components/ui/Panel";
import { useEventState, useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import { useRouter } from "next/router";
import { pay } from "@/requests/transaction";

const DelegatesPayments = ({
  event,
  registration,
  payments,
  ledgers,
  session,
}) => {
  const methods = useForm();
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

  const [selectedLedgers, setSelectedLedgers] = useState([]);
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const router = useRouter();

  const handleLedgersSelect = (ledger) => {
    setSelectedLedgers(ledger);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onSubmit = async (dataForm) => {
    try {
      await pay(selectedLedgers, event, dataForm, session);
      refreshData();
      addToast("Payment Success", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (e) {
      refreshData();
      addToast("Payment Failed Error", {
        appearance: "error",
        autoDismiss: true,
      });
    }
  };

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Payments" />

      <Panel
        title="Pending and Completed Payments"
        color="inverse"
        maximizable
        collapsable
      >
        <PaymentsTable items={payments} />
      </Panel>

      <hr className="m-t-0  bg-black-transparent-1" />
      <FormProvider {...methods}>
        <PaymentForm
          withPanel
          event={event}
          ledgers={selectedLedgers}
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <Panel title="Outstanding" color="inverse" maximizable collapsable>
            <OutstandingInvoiceItemsTable
              event={event}
              items={ledgers}
              setSelected={handleLedgersSelect}
              discount={currentDiscount}
              setDiscount={setCurrentDiscount}
              bordered
            />
          </Panel>
        </PaymentForm>
      </FormProvider>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session?.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      const registrationResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}?withEventData=1&withEventAddonPagesData=1`,
        headers,
      });

      const paymentsResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}/payments`,
        headers,
      });

      const ledgersResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}/ledgers?payable=0`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          registration: registrationResponse.data.data,
          ledgers: ledgersResponse.data.data,
          payments: paymentsResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    props: {},
  };
};

DelegatesPayments.Layout = ViewDelegateLayout;

export default DelegatesPayments;

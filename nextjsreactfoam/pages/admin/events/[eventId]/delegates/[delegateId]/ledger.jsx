import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const DelegateLedger = ({ registration, ledgers }) => {
  /**
   * Sets the delegate to be used for the entire delegate-related pages.
   * This must be implemented in every delegate page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_REGISTRATION,
      payload: registration,
    });
  }, [registration]);

  return <div></div>;
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const registrationResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}`,
        headers,
      });

      const delegatePayableLedgers = await api({
        url: `/events/${context.params.eventId}/registrations/${context.query.delegateId}}?payable=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          registration: registrationResponse.data.data,
          ledgers: delegatePayableLedgers.data.data,
        },
      };
    } catch (e) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
};

DelegateLedger.Layout = ViewDelegateLayout;

export default DelegateLedger;

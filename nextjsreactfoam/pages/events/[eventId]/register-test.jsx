import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventRegistrationWizard from "@/components/forPage/EventRegistrationWizard";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Widget from "@/components/ui/Widget";
import Icon from "@/components/ui/Icon";
import { useGlobalState, useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const DelegateWizard = ({ event, user, session }) => {
  const t = useTranslations();
  const methods = useForm();
  const { globalEvent, globalUser } = useGlobalState();
  const globalDispatch = useGlobalDispatch();

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event's pages.
   */
  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });

    globalDispatch({
      type: actionTypes.SET_USER,
      payload: user,
    });
  }, []);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Register" />
      {globalEvent && globalUser && <EventRegistrationWizard />}
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  /**
   * To request to an authorized API, session has to be set. Session
   * has the accessToken which is required to access Currinda API.
   */
  if (session) {
    /**
     * nextApi is a utility to make a request to the
     * nextJS API (not Currinda API). It is an instance with the
     * App URL as its baseURL.
     */
    const eventResponse = await api({
      url: `/events/${context?.params?.eventId}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const userResponse = await api({
      url: `/users/${session?.user?.id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    /**
     * MUST: Always pass the session and context
     * data to the component to have an access to essential
     * data such as the "session.accessToken" inside the component.
     */
    return {
      props: {
        session,
        context: await getContextProps(context),
        event: eventResponse.data.data,
        user: userResponse.data.data,
      },
    };
  }

  /**
   * Always return a "prop" property, or else an
   * error will occur.
   */
  return {
    props: {},
  };
};

DelegateWizard.authorized = true;
// DelegateWizard.allowedRoles = [];
DelegateWizard.Layout = DashboardLayout;

export default DelegateWizard;

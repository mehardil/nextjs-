import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import UserMembershipsTable from "@/components/common/UserMembershipsTable";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const DelegatesOrganisation = ({ registration, memberships, session }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

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

  return (
    <ContentErrorBoundary>
      <PageHeader title="Organisations" />
      <Panel
        title="Organisations/Memberships"
        color="inverse"
        maximizable
        collapsable
      >
        <UserMembershipsTable items={memberships} />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });

      const registrationResponse = await api({
        url: `/events/${context.params.eventId}/registrations/${context.params.delegateId}`,
        headers,
      });

      const membershipsResponse = await api({
        url: `/memberships?user=${registrationResponse?.data?.data?.user?.id}&event=${context.params.eventId}`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          registration: registrationResponse.data.data,
          memberships: membershipsResponse.data.data,
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

DelegatesOrganisation.Layout = ViewDelegateLayout;

export default DelegatesOrganisation;

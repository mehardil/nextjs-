import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useToasts } from "react-toast-notifications";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import UserViewProfile from "@/components/common/UserViewProfile";
import DelegateDashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const EventsUserProfile = ({ user, event }) => {
  const router = useRouter();
  const { addToast } = useToasts();
  const t = useTranslations();
  const globalDispatch = useGlobalDispatch();

  const pageHeaderToolbar = (
    <Link
      href={{
        pathname: paths.DELEGATE_PROFILE_EDIT,
        query: { eventId: router.query.eventId },
      }}
      passHref
    >
      <Button tag="a" className="mr-1" color="primary" isCircle>
        <Icon icon="edit" type="far" className="mr-1" />
        {t("common.forms.editEntity", {
          entity: t("common.profile"),
        })}
      </Button>
    </Link>
  );

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <ContentErrorBoundary>
      <PageHeader title={t("common.profile")} toolbar={pageHeaderToolbar} />
      <UserViewProfile {...{ user }} />
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
    const userResponse = await api({
      url: `/users/${session?.user.id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    const eventResponse = await api({
      url: `/events/${context.params.eventId}?withBasicStats=1`,
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
        user: userResponse.data.data,
        event: eventResponse.data.data,
      },
    };
  }

  return {
    props: {},
  };
};

EventsUserProfile.authorized = true;
// EventsUserProfile.allowedRoles = [];
EventsUserProfile.Layout = DelegateDashboardLayout;

export default EventsUserProfile;

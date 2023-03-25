import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ProfileForm from "@/components/forms/ProfileForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";

const UpdateUserProfile = ({ user, event }) => {
  const t = useTranslations();
  const methods = useForm({ defaultValues: user });
  const globalDispatch = useGlobalDispatch();

  const pageHeaderToolbar = (
    <div className="row justify-content-end mb-2">
      <Button className="" color="primary" isCircle>
        <Icon icon="save" type="far" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </div>
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
      <PageHeader title="Edit User Profile" toolbar={pageHeaderToolbar} />
      <Panel title="Edit Profile" color="inverse">
        <FormProvider {...methods}>
          <ProfileForm />
        </FormProvider>
      </Panel>
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

UpdateUserProfile.authorized = true;
UpdateUserProfile.Layout = DashboardLayout;

export default UpdateUserProfile;

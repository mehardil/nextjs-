import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import EmailPreview from "@/components/common/EmailPreview";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { useEventDispatch } from "@/contexts/EventContext";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Widget from "@/components/ui/Widget";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";

const CampaignDashboard = ({ event, campaign }) => {
  const eventDispatch = useEventDispatch();

  const stats = [
    {
      key: "received_emails",
      title: "Received",
      description: "Number of campaign recipients",
      color: "teal",
      icon: "inbox",
    },
    {
      key: "bounced_emails",
      title: "Bounced",
      description: "Number of undeliverable campaigns",
      color: "orange",
      icon: "undo",
    },
    {
      key: "opened_emails",
      title: "Opened",
      description: "Number of emails opened",
      color: "blue",
      icon: "envelope-open",
    },
    {
      key: "draft_emails",
      title: "Drafts",
      description: "Number of drafts",
      color: "purple",
      icon: "archive",
    },
  ];

  const recipientsTableColumns = [
    { key: "first_name" },
    { key: "last_name" },
    { key: "email" },
    { key: "role" },
    { key: "organisation" },
  ];

  const recipientsTableScopedSlots = {};

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [campaign]);

  return (
    <>
      <PageHeader title={campaign?.name} />
      <div className="m-b-10 f-s-10 m-t-10">
        <b className="text-inverse">Campaign Stats</b>
      </div>
      <div className="row">
        {stats.map(({ key, title, description, icon, color }) => (
          <div className="col-md-3" key={key}>
            <Widget.Stat
              key={key}
              title={title}
              number={campaign?.[key]}
              description={description}
              color={color}
              icon={icon}
            />
          </div>
        ))}
      </div>
      <Panel title="Email Preview" color="inverse" maximizable collapsable>
        <EmailPreview rawContent={campaign?.raw_content} />
      </Panel>
      <Panel title="Recipients" color="inverse" maximizable collapsable>
        <Table
          items={campaign?.recipients}
          columns={recipientsTableColumns}
          scopedSlots={recipientsTableScopedSlots}
        />
      </Panel>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      const campaignResponse = await api({
        url: `/campaigns/${context.params.communicationId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          campaign: campaignResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

CampaignDashboard.Layout = ViewEventLayout;

export default CampaignDashboard;

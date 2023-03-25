import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { truncate } from "lodash";
import PageHeader from "@/components/common/PageHeader";
import ViewDelegateLayout from "@/components/layouts/ViewDelegateLayout";
import Panel from "@/components/ui/Panel";
import Pill from "@/components/ui/Pill";
import Table from "@/components/ui/Table";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";

const DelegateCommunications = ({ registration, communications, meta }) => {
  const t = useTranslations();
  const eventDispatch = useEventDispatch();

  const tableColumns = [
    { key: "sent_to", label: "To" },
    { key: "date_added", label: "Sent" },
    { key: "bounced", label: "Delivered" },
    { key: "subject", label: "Subject" },
    { key: "content", label: "Content" },
    { key: "from", label: "Content" },
  ];

  const tableScopedSlots = {
    from: ({ from }) => <>{from?.email}</>,
    content: ({ content }) => <>{truncate(content)}</>,
    sent_to: ({ sent_to }) => (
      <>{`${sent_to?.first_name} ${sent_to?.last_name}`}</>
    ),
    bounced: (item) => (
      <>
        <Pill color={!item?.bounced ? "success" : "danger"}>
          {!item?.bounced ? "Delivered" : "Bounced"}
        </Pill>
      </>
    ),
  };

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
    <>
      <PageHeader title={t("common.communication", { entries: 2 })} />
      <Panel
        title={t("common.communication", { entries: 2 })}
        color="inverse"
        maximizable
        collapsable
      >
        <Table
          items={communications}
          columns={tableColumns}
          scopedSlots={tableScopedSlots}
          bordered
        />
      </Panel>
    </>
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
      const registrationResponse = await api({
        headers,
        url: interpolatePath(apiPaths.EVT_REGISTRATION, {
          eventId: context.params.eventId,
          registrationId: context.params.delegateId,
        }),
      });

      const delegateCommunications = await api({
        headers,
        url: interpolatePath(apiPaths.EVT_REGISTRATION_COMMUNICATIONS, {
          eventId: context.params.eventId,
          registrationId: context.params.delegateId,
          query: {
            page: context.query.page || 1,
            include: "sentTo",
            ...context.query,
          },
        }),
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          registration: registrationResponse.data.data,
          communications: delegateCommunications.data.data,
          meta: delegateCommunications.data.meta,
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

DelegateCommunications.Layout = ViewDelegateLayout;

export default DelegateCommunications;

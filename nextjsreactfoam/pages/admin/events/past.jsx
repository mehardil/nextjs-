import React, { useState, forwardRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventsTable from "@/components/common/EventsTable";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import EventDuplicateModal from "@/components/modals/EventDuplicateModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import { ADMIN } from "@/constants/roles";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { useToasts } from "react-toast-notifications";
import SweetAlert from "@/components/ui/SweetAlert";

const PastEventsPage = ({ events, context, session, meta }) => {
  const router = useRouter();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isSaving, setSaving] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [toDeleteCompanyId, setToDeleteCompanyId] = React.useState();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentEvents, setCurrentEvents] = useState(events);
  const [isShowDuplicateModal, setShowDuplicateModal] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState();
  const initialNumOfEntries = context.query.perPage;

  const columns = [
    { key: "short_name", label: "Short Name" },
    { key: "long_name", label: "Long Name" },
    { key: "type", label: "Type" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "registration_open", label: "Registration Open" },
    { key: "registration_end", label: "Registration End" },
    { key: "action", label: "Action", _style: { width: "8%" } },
  ];
  const refreshData = () => {
    router.replace(router.asPath);
  };
  const onConfirmDelete = async () => {
    const session = await getSession(context);

    try {
      await api({
        url: `/events/${toDeleteCompanyId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      addToast("Event successfully deleted.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to delete event.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const scopedSlots = {
    short_name: ({ id, short_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_EVT_DASHBOARD, query: { eventId: id } }}
        >
          <a>{short_name}</a>
        </Link>
      );
    },
    long_name: ({ id, long_name }) => {
      return (
        <Link
          href={{ pathname: paths.ADMIN_EVT_DASHBOARD, query: { eventId: id } }}
        >
          <a>{long_name}</a>
        </Link>
      );
    },
    action: (item) => (
      <>
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Duplicate",
              onClick: () => {
                setEventToDuplicate(item);
                setShowDuplicateModal(true);
              },
            },
            {
              label: "Delete",
              onClick: () => {
                setToDeleteCompanyId(item.id);
                setShowDeleteConfirm(true);
              },
            },
          ]}
        >
          <Link
            href={{
              pathname: paths.ADMIN_EVT_DASHBOARD,
              query: { eventId: item.id },
            }}
            passHref
          >
            <Button tag="a" size="xs" color="white">
              {t("common.forms.open")}
            </Button>
          </Link>
        </Button.Dropdown>
      </>
    ),
  };

  const pageHeaderToolbar = (
    <Link href={paths.ADMIN_EVT_ADD} passHref>
      <Button tag="a" color="primary" isCircle>
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.addNewEntity", {
          entity: t("common.event", { entries: 1 }),
        })}
      </Button>
    </Link>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader
        toolbar={pageHeaderToolbar}
        title={t("common.pastEntity", {
          entity: t("common.event", { entries: 2 }),
        })}
      />
      {isShowDuplicateModal && (
        <EventDuplicateModal
          isShow={isShowDuplicateModal}
          onHide={() => setShowDuplicateModal(false)}
          defaultValues={eventToDuplicate}
        />
      )}
      <Panel title="Events" color="inverse" maximizable collapsable>
        <EventsTable
          items={currentEvents}
          columns={columns}
          scopedSlots={scopedSlots}
          initialPage={meta.current_page}
          numOfPages={meta.last_page}
          totalItems={meta.total}
          from={meta.from}
          to={meta.to}
          initialKeyword={context.query.keyword}
          bordered
          {...{ initialNumOfEntries }}
        />
        {showDeleteConfirm && (
          <SweetAlert
            danger
            showCancel
            confirmBtnText="Delete"
            type="danger"
            confirmBtnBsStyle="danger"
            desc="Are you sure you want to delete this event?"
            title="Delete Confirmation"
            focusCancelBtn
            onConfirm={onConfirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          >
            Are you sure you want to delete this Event?
          </SweetAlert>
        )}
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
    const response = await api({
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
      url: interpolatePath(apiPaths.EVTS, {
        query: {
          ...context.query,
          page: context.query.page || 1,
          past: 1,
        },
      }),
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
        events: response.data.data,
        meta: response.data.meta,
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

PastEventsPage.authorized = true;
PastEventsPage.allowedRoles = [ADMIN];
PastEventsPage.Layout = DashboardLayout;
PastEventsPage.defaultProps = {
  events: [],
};

export default PastEventsPage;

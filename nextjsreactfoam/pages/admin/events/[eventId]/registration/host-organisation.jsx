import React, { useState, useEffect } from "react";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { getSession } from "next-auth/client";
import queryString from "query-string";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import actionTypes from "@/contexts/action-types";
import { useTranslations } from "next-intl";
import { useEventDispatch } from "@/contexts/EventContext";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import Table from "@/components/ui/Table";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import HostOrganisationModal from "@/components/modals/HostOrganisationModal";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import PopupAlert from "@/components/ui/PopupAlert";
import SanitizedHTML from "react-sanitized-html";

const HostOrganisation = ({ event, eventOrganisations, context }) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [showAddHostOrganisationModal, setShowAddHostOrganisationModal] =
    useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedEventOrganisation, setSelectedEventOrganisation] =
    useState(undefined);

  const columns = [
    { key: "organisation", label: "Organisation" },
    { key: "hosting", label: "Hosting" },
    { key: "attached_extras", label: "Attached Extras" },
    { key: "action", label: "Action" },
  ];

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

  const scopedSlots = {
    hosting: ({ hosting }) => <td>{hosting ? "Yes" : "No"}</td>,
    organisation: ({ organisation }) => <td>{organisation?.long_name}</td>,
    attached_extras: ({ attached_extras }) => (
      <td>
        <SanitizedHTML html={attached_extras} />
      </td>
    ),
    action: (eventOrganisation) => {
      return (
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Delete",
              onClick: () => {
                setSelectedEventOrganisation(eventOrganisation);
                setShowDeletePopup(true);
              },
            },
          ]}
        >
          <Button
            onClick={() => {
              setSelectedEventOrganisation(eventOrganisation);
              setShowAddHostOrganisationModal(true);
            }}
          >
            Edit
          </Button>
        </Button.Dropdown>
      );
    },
  };

  const handleDeleteOrganisation = async (id) => {
    const session = await getSession(context);
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    api
      .delete(`/events/${event.id}/organisations/${id}`, { headers })
      .then((res) => {
        addToast("Host Organisation deleted successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        refreshData();
      })
      .catch((err) => {
        addToast("Failed to delete host organisation.", {
          appearance: "error",
          autoDismiss: true,
        });
      })
      .finally(() => {});
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      onClick={() => setShowAddHostOrganisationModal(true)}
    >
      <Icon icon="plus" className="mr-1" />
      Add Organisation
    </Button>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Host Organisation" toolbar={pageHeaderToolbar} />
      <Panel title="Host Organisation" color="inverse" maximizable collapsable>
        <Table
          items={eventOrganisations}
          columns={columns}
          tableFilter={false}
          scopedSlots={scopedSlots}
          bordered
        />
      </Panel>
      {showAddHostOrganisationModal && (
        <HostOrganisationModal
          defaultValues={selectedEventOrganisation}
          isShow={showAddHostOrganisationModal}
          onHide={() => {
            setShowAddHostOrganisationModal(false);
            setSelectedEventOrganisation(undefined);
          }}
          onSubmit={() => {
            setShowAddHostOrganisationModal(false);
            refreshData();
          }}
        />
      )}
      {showDeletePopup && selectedEventOrganisation?.id && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          type="danger"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={() => {
            handleDeleteOrganisation(selectedEventOrganisation?.id);
          }}
          onCancel={() => {
            setShowDeletePopup(false);
          }}
        >
          Are you sure you want to delete this organisation for this event?
        </PopupAlert>
      )}
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  if (session) {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const eventOrganisationResponse = await api({
        url: `/events/${context.params.eventId}/organisations?sortBy=ID`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          eventOrganisations: eventOrganisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

HostOrganisation.Layout = ViewEventLayout;

export default HostOrganisation;

import React, { useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import queryString from "query-string";
import isPlainObject from "lodash/isPlainObject";
import omit from "lodash/omit";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import LocationsHeader from "@/components/common/LocationsHeader";
import PageHeader from "@/components/common/PageHeader";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import VenueModal from "@/components/modals/VenueModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Pill from "@/components/ui/Pill";
import PopupAlert from "@/components/ui/PopupAlert";
import Table from "@/components/ui/Table";
import { createVenue, updateVenue } from "@/requests/venues";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import paramsSanitizer from "@/utils/paramsSanitizer";
import { useToasts } from "react-toast-notifications";
import VenuesTable from "@/components/common/VenuesTable";

const AllVenues = ({ venues, context, meta, session }) => {
  const router = useRouter();
  const [isVenueModalActive, setVenueModalActive] = useState(false);
  const initialNumOfEntries = context.query.perPage;
  const [activeVenue, setActiveVenue] = useState();
  const [isShowDeleteVenueAlert, setShowDeleteVenueAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "venue_rooms",
      label: "Spaces",
      _style: { width: "20%", "overflow-wrap": "break-word" },
    },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "actions", label: "Actions", _style: { width: "5%" } },
  ];

  const handleVenueDelete = async () => {
    setShowDeleteVenueAlert(false);

    if (activeVenue) {
      try {
        setIsLoading(true);

        const response = await api({
          url: `/venues/${activeVenue.id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });

        router.push(router);

        addToast("Venue successfully deleted.", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (err) {
        addToast(err?.message ? err?.message : "Failed to delete venue.", {
          appearance: "error",
          autoDismiss: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVenueSubmit = async (params) => {
    setIsLoading(true);

    if (activeVenue) {
      try {
        await updateVenue(activeVenue?.id, params, session.accessToken);
        addToast("Venue details successfully saved.", {
          appearance: "success",
          autoDismiss: true,
        });

        router.push(router);
      } catch (err) {
        addToast(
          err?.message ? err?.message : "Failed to save venue details.",
          {
            appearance: "error",
            autoDismiss: true,
          }
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        await createVenue(params, session.accessToken);
        addToast("Venue details successfully saved.", {
          appearance: "success",
          autoDismiss: true,
        });

        router.push(router);
      } catch (err) {
        addToast(
          err?.message ? err?.message : "Failed to save venue details.",
          {
            appearance: "error",
            autoDismiss: true,
          }
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pageHeaderToolbar = (
    <Button color="primary" isCircle onClick={() => setVenueModalActive(true)}>
      <Icon icon="plus" className="mr-1" />
      Add Venue
    </Button>
  );

  const scopedSlots = {
    venue_rooms: ({ venue_rooms }) => {
      return venue_rooms.map((room) => (
        <Pill color="info" className="mr-1 mb-1 d-inline-block">
          {room?.name}
        </Pill>
      ));
    },
    actions: (item) => (
      <Button.Dropdown
        size="xs"
        color="white"
        options={[
          {
            label: "Delete",
            onClick: () => {
              setActiveVenue(item);
              setShowDeleteVenueAlert(true);
            },
          },
        ]}
      >
        <Button
          onClick={() => {
            setActiveVenue(item);
            setVenueModalActive(true);
          }}
        >
          Edit
        </Button>
      </Button.Dropdown>
    ),
  };

  return (
    <ContentErrorBoundary>
      <PageHeader
        title="Venues"
        description={<LocationsHeader />}
        toolbar={pageHeaderToolbar}
      />
      {!!isVenueModalActive && (
        <VenueModal
          isSaving={isLoading}
          isShow={isVenueModalActive}
          onHide={() => {
            setVenueModalActive(false);
            setActiveVenue(undefined);
          }}
          onSubmit={handleVenueSubmit}
          defaultValues={activeVenue}
        />
      )}
      {isShowDeleteVenueAlert && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete Venue"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={handleVenueDelete}
          onCancel={() => setShowDeleteVenueAlert(false)}
        >
          Are you sure you want to delete this venue?
        </PopupAlert>
      )}
      <Panel title="Venues" color="inverse" maximizable collapsable>
        <VenuesTable
          items={venues}
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
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  const urlQueryString = queryString.stringify({
    ...context.query,
    page: context.query.page || 1,
  });

  if (session) {
    const response = await api({
      url: `/venues?${urlQueryString}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      },
    });

    return {
      props: {
        session,
        context: await getContextProps(context),
        venues: response.data.data,
        meta: response.data.meta,
      },
    };
  }

  return {
    props: {},
  };
};

AllVenues.authorized = true;
AllVenues.Layout = DashboardLayout;

export default AllVenues;

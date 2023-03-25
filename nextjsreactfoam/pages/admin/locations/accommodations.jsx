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
import GeneralAccommodationModal from "@/components/modals/GeneralAccommodationModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Pill from "@/components/ui/Pill";
import PopupAlert from "@/components/ui/PopupAlert";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import paramsSanitizer from "@/utils/paramsSanitizer";
import { useToasts } from "react-toast-notifications";
import VenuesTable from "@/components/common/VenuesTable";

const AllAccommodations = ({ accommodations, context, meta, session }) => {
  const router = useRouter();
  const [isAccommodationModalActive, setAccommodationModalActive] =
    useState(false);
  const initialNumOfEntries = context.query.perPage;
  const [activeAccommodation, setActiveAccommodation] = useState();
  const [isShowDeleteAccommodationAlert, setShowDeleteAccommodationAlert] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "accommodation_rooms",
      label: "Spaces",
      _style: { width: "20%", "overflow-wrap": "break-word" },
    },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "actions", label: "Actions", _style: { width: "5%" } },
  ];

  const handleAccommodationDelete = async () => {
    if (activeAccommodation) {
      try {
        const response = await api({
          url: `/accommodations/${activeAccommodation.id}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-Tenant": getTenant(),
          },
        });

        router.push(router);

        addToast("Accommodation successfully deleted.", {
          appearance: "success",
          autoDismiss: true,
        });
      } catch (err) {
        addToast(
          err?.message ? err?.message : "Failed to delete accommodation.",
          {
            appearance: "error",
            autoDismiss: true,
          }
        );
      }
    }
  };

  const handleAccommodationSubmit = async (params) => {
    try {
      setIsLoading(true);

      let formData = new FormData();

      const paramValues = paramsSanitizer(
        omit(params, ["accommodation_rooms"])
      );

      /**
       * Appends each av note in a multi-dimensional array.
       */
      if (params.accommodation_rooms) {
        params.accommodation_rooms.forEach((accommodationRoom, index) => {
          for (const [key, value] of Object.entries(
            paramsSanitizer(accommodationRoom)
          )) {
            formData.append(`accommodation_rooms[${index}][${key}]`, value);
          }
        });
      }

      for (const [key, value] of Object.entries(paramValues)) {
        /**
         * Check if its a select field's label-value pair object prop.
         * If it is, extract its value.
         */
        if (isPlainObject(value)) {
          formData.append(key, value.value);
        } else {
          formData.append(key, value);
        }
      }

      if (activeAccommodation?.id) {
        formData.append("_method", "PUT");
      }

      const response = await api({
        url: `/accommodations${
          activeAccommodation?.id ? `/${activeAccommodation?.id}` : ""
        }`,
        method: "POST",
        data: formData,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
          "Content-Type": "multipart/form-data",
        },
      });

      router.push(router);

      addToast("Accommodation successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });
    } catch (err) {
      addToast(err?.message ? err?.message : "Failed to save accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => setAccommodationModalActive(true)}
    >
      <Icon icon="plus" className="mr-1" />
      Add Accommodation
    </Button>
  );

  const scopedSlots = {
    accommodation_rooms: ({ accommodation_rooms }) => {
      return accommodation_rooms.map((room) => (
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
              setActiveAccommodation(item);
              setShowDeleteAccommodationAlert(true);
            },
          },
        ]}
      >
        <Button
          onClick={() => {
            setActiveAccommodation(item);
            setAccommodationModalActive(true);
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
        title="Accommodations"
        description={<LocationsHeader />}
        toolbar={pageHeaderToolbar}
      />
      {!!isAccommodationModalActive && (
        <GeneralAccommodationModal
          isSaving={isLoading}
          isShow={isAccommodationModalActive}
          onHide={() => {
            setAccommodationModalActive(false);
            setActiveAccommodation(undefined);
          }}
          onSubmit={handleAccommodationSubmit}
          defaultValues={activeAccommodation}
        />
      )}
      {isShowDeleteAccommodationAlert && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete Accommodation"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={handleAccommodationDelete}
          onCancel={() => setShowDeleteAccommodationAlert(false)}
        >
          Are you sure you want to delete this accommodation?
        </PopupAlert>
      )}
      <Panel title="Accommodations" color="inverse" maximizable collapsable>
        <VenuesTable
          items={accommodations}
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
      url: `/accommodations?${urlQueryString}`,
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
        accommodations: response.data.data,
        meta: response.data.meta,
      },
    };
  }

  return {
    props: {},
  };
};

AllAccommodations.authorized = true;
AllAccommodations.Layout = DashboardLayout;

export default AllAccommodations;

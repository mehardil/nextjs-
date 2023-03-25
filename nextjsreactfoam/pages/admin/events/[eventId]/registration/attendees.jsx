import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import EventAttendeeTypeModal from "@/components/modals/EventAttendeeTypeModal";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import PopupAlert from "@/components/ui/PopupAlert";
import Table from "@/components/ui/Table";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import { type } from "os";

const Attendees = ({ event, eventAttendees ,event1}) => {
  var d1 = " "
  for (let i = 0; i < event1.length; i++) {
   d1 += event1[i].question + "   ";}
   var x = d1;
  const router = useRouter();
  const data = router.query;
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [event1Popup, setEvent1Popup] = useState(x);

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "quantity", label: "Quantity" },
    { key: "registration_url", label: "Registration URL" },
    { key: "attached_extra", label: "Custom Question" },
    { key: "action", label: "Action" },
  ];

  const scopedSlots =(d1)= {
   name: ({ type }) => <td>{type}</td>,
   type: (item) => {
      if (item.member) {
        return <td>Member</td>;
      }
      if (item.student) {
        return <td>Student</td>;
      }
      if (item.invited) {
        return <td>VIP</td>;
      }
      if (item.trade) {
        return <tdz>Sponsor/Exhibitor</tdz>;
      }
      if (item.attached_extra) {
        return <td></td>;
      }
     return <td>{item.type}</td>;
    },
    registration_url: (category) => {
      return <Link href="/user/my-events">{`${window.location.origin}`}</Link>;

    },
    attached_extra: (d1)=>{


      return event1Popup
      },
    // attached_extra: (s1) => {
    //   return (s1)
    // },
    action: (category) => {
      return (
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Delete",
              onClick: () => {
                setSelectedCategory(category);
                setShowDeletePopup(true);
              },
            },
          ]}
        >
          <Button
            onClick={() => {
              setSelectedCategory(category);
              setShowAddCategoryModal(true);
            }}
          >
            Edit
          </Button>
        </Button.Dropdown>
      );
    },
  };
 useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);
  const handleDeleteCategory = async (id) => {
    const session = await getSession();
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };
    api
      .delete(`/events/${event.id}/attendee-types/${id}`, { headers })
      .then((res) => {
        addToast("Category deleted successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        refreshData();
      })
      .catch((err) => {
        addToast("Failed to delete category.", {
          appearance: "error",
          autoDismiss: true,
        });
      });
  };
  const refreshData = () => {
    router.replace(router.asPath);
  };
  const pageHeaderToolbar = (
    <Button color="primary" onClick={() => setShowAddCategoryModal(true)}>
      <Icon icon="plus" className="mr-1" />
      Add Category
    </Button>
  );
  return (
    <ContentErrorBoundary>
      <PageHeader title="Attendees" toolbar={pageHeaderToolbar} />
      {showAddCategoryModal && (
        <EventAttendeeTypeModal
          defaultValues={selectedCategory}
          isShow={showAddCategoryModal}
          onHide={() => {
            setSelectedCategory(undefined);
            setShowAddCategoryModal(false);
          }}
          onSubmit={() => {
            setShowAddCategoryModal(false);
            setSelectedCategory(undefined);
            refreshData();
          }}
        />
      )}
      {showDeletePopup && selectedCategory?.id && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          type="danger"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          onConfirm={() => {
            handleDeleteCategory(selectedCategory?.id);
          }}
          onCancel={() => {
            setShowDeletePopup(false);
          }}
        >
          Are you sure you want to delete this category?
        </PopupAlert>
      )}
      <Panel title="Attendees" color="inverse" maximizable collapsable>
        <Table
          items={eventAttendees}
          columns={columns}
          tableFilter={false}
          scopedSlots={scopedSlots}
          bordered
        />
      </Panel>
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
  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };
  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}`,
        headers,
});


const questionResponse = await api({
  url: `/events/${context.params.eventId}/custom-questions`,
  method: "GET",
  headers: {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
},
      });


      const eventAttendeesResponse = await api({
        url: `/events/${context.params.eventId}/attendee-types?sortBy=DateAdded`,
        headers,
      });
      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          eventAttendees: eventAttendeesResponse.data.data,
          event1: questionResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,

      };
    }

  }
}

Attendees.Layout = ViewEventLayout;
export default Attendees;

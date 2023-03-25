import React, { useEffect } from "react";
import { getSession } from "next-auth/client";
import Link from "next/link";
import {
  useForm,
  useFormContext,
  Controller,
  FormProvider,
} from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { groupBy } from "lodash";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Wizard from "@/components/ui/Wizard2";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import { withAuthUser, withEvent, withTenant } from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";
import interpolatePath from "@/utils/interpolatePath";

const RegisterItemsPage = ({ itemCosts, authUser, event, tenant, headers }) => {
  const methods = useForm();
  const { addToast } = useToasts();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);
  const groupedItemCosts = groupBy(
    itemCosts,
    (cost) => cost.event_attendee_type.type
  );

  const handleSubmit = async (params, { redirectToNextStep }) => {
    const saveRegistrationTypeResponse = await api({
      method: "POST",
      headers,
      url: interpolatePath(apiPaths.EVT_REGISTRATIONS, { eventId: event?.id }),
      data: {
        item: params.item,
        user: authUser.id,
      },
    });

    addToast("Successfully added registration", {
      appearance: "success",
      autoDismiss: true,
    });

    redirectToNextStep();
  };

  /**
   * Display a custom button if no item costs is available
   * for the logged in user. It will redirect them to the event dashboard.
   *
   * @returns ReactElement
   */
  const CustomNextButton = ({ redirectToNextStep }) => {
    if (Boolean(!itemCosts.length)) {
      return (
        <Link
          href={{
            pathname: paths.DELEGATE_DASHBOARD,
            query: { eventId: event?.id },
          }}
        >
          <Button tag="a" color="primary text-white">
            Return to dashboard
          </Button>
        </Link>
      );
    }

    /**
     * , proceed with normal submission.
     */
    return (
      <Button
        color="primary"
        onClick={() => {
          return methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )();
        }}
      >
        Next
      </Button>
    );
  };

  useEventRegistrationDispatches({ authUser, event, tenant });

  return (
    <FormProvider {...methods}>
      <Wizard
        skippable
        steps={eventRegistrationSteps}
        nextBtn={CustomNextButton}
      >
        <>
          {Boolean(itemCosts.length) ? (
            <>
              {" "}
              {Object.entries(groupedItemCosts).map(([type, costs], index) => (
                <div key={index} className="mb-4">
                  <h5 className="text-success">{type}</h5>
                  {costs.map((cost, index) => (
                    <div key={index}>
                      <Controller
                        name="item"
                        control={methods.control}
                        render={({ name, value, onChange }) => (
                          <Input.Radio
                            name={name}
                            defaultChecked={value}
                            isInline
                            onChange={(newValue) => {
                              methods.setValue(name, cost.id);
                            }}
                            label={
                              <>{`${cost.name} - ${event?.currency} ${cost.cost}`}</>
                            }
                          />
                        )}
                      />
                    </div>
                  ))}
                </div>
              ))}
              <div className="form-row">
                <div className="form-group col-md-12">
                  <Controller
                    name="terms_and_conditions"
                    control={methods.control}
                    rules={{
                      required:
                        "You must accept the terms and conditions in order to proceed.",
                    }}
                    render={({ name, value, onChange }) => (
                      <Input.Checkbox
                        defaultChecked={value}
                        feedback={methods?.errors?.[name]?.message}
                        onChange={(newVal) =>
                          onChange(newVal ? newVal : undefined)
                        }
                        label={
                          <>
                            I agree to the {tenant?.long_name}
                            <Link href={event?.terms_and_conditions}>
                              <a> terms and conditions.</a>
                            </Link>
                          </>
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <Alert color="warning" classname="w-25">
              No items currently available for this event.
            </Alert>
          )}
        </>
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEvent, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const itemCostsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_REGISTRATION_COSTS, {
            eventId: context.query.eventId,
            query: {
              forUser: session.user.id,
              include: "eventAttendeeType",
            },
          }),
        });

        return {
          props: {
            headers,
            session,
            itemCosts: itemCostsResponse.data.data,
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

RegisterItemsPage.authorized = true;
RegisterItemsPage.Layout = RegistrationLayout;

export default RegisterItemsPage;

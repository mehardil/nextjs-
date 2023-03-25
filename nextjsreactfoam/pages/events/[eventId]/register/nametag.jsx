import React, { useState } from "react";
import { getSession } from "next-auth/client";
import Image from "next/image";
import Link from "next/link";
import {
  useForm,
  useFormContext,
  Controller,
  FormProvider,
} from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import RegistrationLayout from "@/components/layouts/RegistrationLayout";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Wizard from "@/components/ui/Wizard2";
import useEventRegistrationDispatches from "@/hooks/useEventRegistrationDispatches";
import useWizardSteps, { EVENT_REGO } from "@/hooks/useWizardSteps";
import { updateUser } from "@/requests/user";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";
import {
  withAuthUser,
  withEventAndAddonPages,
  withTenant,
} from "@/utils/pipes";
import serverSidePipe from "@/utils/serverSidePipe";
import interpolatePath from "@/utils/interpolatePath";

const RegisterNametagPage = ({ authUser, event, tenant, headers, session }) => {
  const methods = useForm({
    defaultValues: { nametag: authUser.nametag || authUser.full_name },
  });
  const { addToast } = useToasts();
  const { getSteps } = useWizardSteps(EVENT_REGO);
  const eventRegistrationSteps = getSteps(event, authUser);
  const watchNametag = methods.watch("nametag");

  const handleSubmit = async (params, { redirectToNextStep }) => {
    await updateUser(authUser.id, params, session.accessToken);
    addToast("User updated successfully", {
      appearance: "success",
      autoDismiss: true,
    });

    redirectToNextStep();
  };

  useEventRegistrationDispatches({ authUser, event, tenant });

  return (
    <FormProvider {...methods}>
      <Wizard
        skippable
        steps={eventRegistrationSteps}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        <div className="row">
          <div className="col-md-4">
            <div className="form-group">
              <Label>Nametag</Label>
              <Controller
                name="nametag"
                control={methods.control}
                render={({ name, value, onChange }) => {
                  return (
                    <Input
                      name={name}
                      defaultValue={value}
                      placeholder="Name"
                      feedback={methods.errors?.[name]?.message}
                      onChange={(text) => {
                        onChange(text);
                      }}
                    />
                  );
                }}
              />
            </div>

            <div className="form-group">
              <Label>Preview</Label>
              <div className="gallery">
                <div
                  className="w-100 image gallery-group-1 b-1 shadow"
                  style={{ minHeight: "120px" }}
                >
                  {!!event?.event_banner && (
                    <div
                      className="image-inner position-relative"
                      style={{ height: "80px" }}
                    >
                      <Image
                        className="w-100 h-auto position-relative"
                        src={event?.event_banner}
                        alt={event?.long_name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div
                    className="image-info"
                    style={{ wordBreak: "break-word" }}
                  >
                    <h3 className="text-aqua text-center fa-3x">
                      {watchNametag}
                    </h3>
                    <hr />
                    <div className="desc text-center">Position, Company</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = async (context) =>
  serverSidePipe(context, [withAuthUser, withEventAndAddonPages, withTenant])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        return {
          props: {
            headers,
            session,
            ...pipeProps,
          },
        };
      }

      return {
        notFound: true,
      };
    }
  );

RegisterNametagPage.authorized = true;
RegisterNametagPage.Layout = RegistrationLayout;

export default RegisterNametagPage;

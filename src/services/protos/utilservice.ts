/**
 * Generated by the protoc-gen-ts.  DO NOT EDIT!
 * compiler version: 4.23.4
 * source: utilservice.proto
 * git: https://github.com/thesayyn/protoc-gen-ts */
import * as pb_1 from "google-protobuf";
import * as grpc_1 from "@grpc/grpc-js";
export class WaitRequest extends pb_1.Message {
    #one_of_decls: number[][] = [];
    constructor(data?: any[] | {
        seconds?: number;
    }) {
        super();
        pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
        if (!Array.isArray(data) && typeof data == "object") {
            if ("seconds" in data && data.seconds != undefined) {
                this.seconds = data.seconds;
            }
        }
    }
    get seconds() {
        return pb_1.Message.getFieldWithDefault(this, 1, 0) as number;
    }
    set seconds(value: number) {
        pb_1.Message.setField(this, 1, value);
    }
    static fromObject(data: {
        seconds?: number;
    }): WaitRequest {
        const message = new WaitRequest({});
        if (data.seconds != null) {
            message.seconds = data.seconds;
        }
        return message;
    }
    toObject() {
        const data: {
            seconds?: number;
        } = {};
        if (this.seconds != null) {
            data.seconds = this.seconds;
        }
        return data;
    }
    serialize(): Uint8Array;
    serialize(w: pb_1.BinaryWriter): void;
    serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
        const writer = w || new pb_1.BinaryWriter();
        if (this.seconds != 0)
            writer.writeInt32(1, this.seconds);
        if (!w)
            return writer.getResultBuffer();
    }
    static deserialize(bytes: Uint8Array | pb_1.BinaryReader): WaitRequest {
        const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new WaitRequest();
        while (reader.nextField()) {
            if (reader.isEndGroup())
                break;
            switch (reader.getFieldNumber()) {
                case 1:
                    message.seconds = reader.readInt32();
                    break;
                default: reader.skipField();
            }
        }
        return message;
    }
    serializeBinary(): Uint8Array {
        return this.serialize();
    }
    static override deserializeBinary(bytes: Uint8Array): WaitRequest {
        return WaitRequest.deserialize(bytes);
    }
}
export class WaitResponse extends pb_1.Message {
    #one_of_decls: number[][] = [];
    constructor(data?: any[] | {
        message?: string;
    }) {
        super();
        pb_1.Message.initialize(this, Array.isArray(data) ? data : [], 0, -1, [], this.#one_of_decls);
        if (!Array.isArray(data) && typeof data == "object") {
            if ("message" in data && data.message != undefined) {
                this.message = data.message;
            }
        }
    }
    get message() {
        return pb_1.Message.getFieldWithDefault(this, 1, "") as string;
    }
    set message(value: string) {
        pb_1.Message.setField(this, 1, value);
    }
    static fromObject(data: {
        message?: string;
    }): WaitResponse {
        const message = new WaitResponse({});
        if (data.message != null) {
            message.message = data.message;
        }
        return message;
    }
    toObject() {
        const data: {
            message?: string;
        } = {};
        if (this.message != null) {
            data.message = this.message;
        }
        return data;
    }
    serialize(): Uint8Array;
    serialize(w: pb_1.BinaryWriter): void;
    serialize(w?: pb_1.BinaryWriter): Uint8Array | void {
        const writer = w || new pb_1.BinaryWriter();
        if (this.message.length)
            writer.writeString(1, this.message);
        if (!w)
            return writer.getResultBuffer();
    }
    static deserialize(bytes: Uint8Array | pb_1.BinaryReader): WaitResponse {
        const reader = bytes instanceof pb_1.BinaryReader ? bytes : new pb_1.BinaryReader(bytes), message = new WaitResponse();
        while (reader.nextField()) {
            if (reader.isEndGroup())
                break;
            switch (reader.getFieldNumber()) {
                case 1:
                    message.message = reader.readString();
                    break;
                default: reader.skipField();
            }
        }
        return message;
    }
    serializeBinary(): Uint8Array {
        return this.serialize();
    }
    static override deserializeBinary(bytes: Uint8Array): WaitResponse {
        return WaitResponse.deserialize(bytes);
    }
}
interface GrpcUnaryServiceInterface<P, R> {
    (message: P, metadata: grpc_1.Metadata, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
    (message: P, metadata: grpc_1.Metadata, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
    (message: P, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
    (message: P, callback: grpc_1.requestCallback<R>): grpc_1.ClientUnaryCall;
}
interface GrpcStreamServiceInterface<P, R> {
    (message: P, metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): grpc_1.ClientReadableStream<R>;
    (message: P, options?: grpc_1.CallOptions): grpc_1.ClientReadableStream<R>;
}
interface GrpWritableServiceInterface<P, R> {
    (metadata: grpc_1.Metadata, options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
    (metadata: grpc_1.Metadata, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
    (options: grpc_1.CallOptions, callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
    (callback: grpc_1.requestCallback<R>): grpc_1.ClientWritableStream<P>;
}
interface GrpcChunkServiceInterface<P, R> {
    (metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): grpc_1.ClientDuplexStream<P, R>;
    (options?: grpc_1.CallOptions): grpc_1.ClientDuplexStream<P, R>;
}
interface GrpcPromiseServiceInterface<P, R> {
    (message: P, metadata: grpc_1.Metadata, options?: grpc_1.CallOptions): Promise<R>;
    (message: P, options?: grpc_1.CallOptions): Promise<R>;
}
export abstract class UnimplementedUtilServiceService {
    static definition = {
        Wait: {
            path: "/utilservice.UtilService/Wait",
            requestStream: false,
            responseStream: false,
            requestSerialize: (message: WaitRequest) => Buffer.from(message.serialize()),
            requestDeserialize: (bytes: Buffer) => WaitRequest.deserialize(new Uint8Array(bytes)),
            responseSerialize: (message: WaitResponse) => Buffer.from(message.serialize()),
            responseDeserialize: (bytes: Buffer) => WaitResponse.deserialize(new Uint8Array(bytes))
        }
    };
    [method: string]: grpc_1.UntypedHandleCall;
    abstract Wait(call: grpc_1.ServerUnaryCall<WaitRequest, WaitResponse>, callback: grpc_1.sendUnaryData<WaitResponse>): void;
}
export class UtilServiceClient extends grpc_1.makeGenericClientConstructor(UnimplementedUtilServiceService.definition, "UtilService", {}) {
    constructor(address: string, credentials: grpc_1.ChannelCredentials, options?: Partial<grpc_1.ChannelOptions>) {
        super(address, credentials, options);
    }
    Wait: GrpcUnaryServiceInterface<WaitRequest, WaitResponse> = (message: WaitRequest, metadata: grpc_1.Metadata | grpc_1.CallOptions | grpc_1.requestCallback<WaitResponse>, options?: grpc_1.CallOptions | grpc_1.requestCallback<WaitResponse>, callback?: grpc_1.requestCallback<WaitResponse>): grpc_1.ClientUnaryCall => {
        return super.Wait(message, metadata, options, callback);
    };
}

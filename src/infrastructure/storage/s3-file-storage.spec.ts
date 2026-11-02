import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { S3FileStorage } from './s3-file-storage';

describe('S3FileStorage', () => {
  const send = jest.fn();
  const storage = new S3FileStorage(
    {
      bucket: 'certificados',
      region: 'auto',
      accessKeyId: 'id',
      secretAccessKey: 'secret',
    },
    { send } as unknown as S3Client,
  );

  beforeEach(() => send.mockReset());

  it('puts the object in the private bucket with its content type', async () => {
    send.mockResolvedValue({});
    const content = Buffer.from('%PDF-1.7');
    await storage.put('certificates/a.pdf', content, 'application/pdf');
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'certificados',
      Key: 'certificates/a.pdf',
      Body: content,
      ContentType: 'application/pdf',
      ContentLength: content.length,
    });
  });

  it('reads the object bytes', async () => {
    send.mockResolvedValue({
      Body: {
        transformToByteArray: () => Promise.resolve(Uint8Array.of(1, 2)),
      },
    });
    await expect(storage.get('k')).resolves.toEqual(Buffer.from([1, 2]));
    expect(send.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
  });

  it('returns null for a missing object', async () => {
    send.mockRejectedValue(
      new NoSuchKey({ message: 'no existe', $metadata: {} }),
    );
    await expect(storage.get('k')).resolves.toBeNull();
  });

  it('deletes the object', async () => {
    send.mockResolvedValue({});
    await storage.delete('k');
    expect(send.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
  });
});
